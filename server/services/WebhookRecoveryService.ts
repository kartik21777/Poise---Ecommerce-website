import { WebhookEvent } from '../models/WebhookEvent.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { deductStockAtomically } from '../controllers/orderController.js';
import { AppError } from '../utils/AppError.js';
import { lockService } from './LockService.js';
import { logger } from '../utils/logger.js';
import { AuditLog } from '../models/AuditLog.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';

const log = logger('WebhookRecoveryService');

export class WebhookRecoveryService {
  /**
   * Reprocesses a failed or dead-letter Webhook Event administratively
   */
  async reprocessEvent(id: string) {
    const startTime = Date.now();
    const webhookEvent = await WebhookEvent.findById(id);
    if (!webhookEvent) {
      throw new AppError(404, `Webhook event with ID ${id} not found.`);
    }

    if (webhookEvent.status === 'PROCESSED') {
      return {
        success: true,
        status: 'PROCESSED',
        message: 'This event was already successfully processed. No retry action taken.',
      };
    }

    // Increment retry count
    const retryCount = (webhookEvent.retryCount || 0) + 1;
    webhookEvent.retryCount = retryCount;
    webhookEvent.status = 'RECEIVED'; // Reset status to execute reprocessing
    await webhookEvent.save();

    // Max 5 attempts threshold for dead-letter classification
    const MAX_RETRY_THRESHOLD = 5;

    try {
      if (retryCount > MAX_RETRY_THRESHOLD) {
        throw new AppError(400, `Event has exceeded the maximum retry limit of ${MAX_RETRY_THRESHOLD} attempts. Stalled in Dead Letter status.`);
      }

      const payload = webhookEvent.payload;
      if (!payload) {
        throw new AppError(400, 'Payload content is missing from Webhook record. Cannot run reprocessing engine.');
      }

      // Extract entities similarly to normalized gateway payload
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;
      
      const gatewayOrderId = orderEntity?.id || paymentEntity?.order_id;
      const gatewayPaymentId = paymentEntity?.id;

      let status: 'CAPTURED' | 'FAILED' | 'AUTHORIZED' | 'REFUNDED' | undefined;
      if (paymentEntity?.status === 'captured') {
        status = 'CAPTURED';
      } else if (paymentEntity?.status === 'failed') {
        status = 'FAILED';
      }

      let orderIdStr = 'N/A';
      let txIdStr = 'N/A';

      if (gatewayOrderId) {
        const transaction = await PaymentTransaction.findOne({ gatewayOrderId });
        if (transaction) {
          txIdStr = transaction.transactionId;
          const order = await Order.findById(transaction.order);
          if (!order) {
            throw new AppError(404, `Associated Order ${transaction.order} not found.`);
          }
          orderIdStr = order._id.toString();

          // Apply state lock to prevent concurrent callback and recovery overlaps
          const lockKey = `lock:payment:order:${orderIdStr}`;
          
          await lockService.withLock(lockKey, 20000, async () => {
            const freshTransaction = await PaymentTransaction.findOne({ gatewayOrderId });
            const freshOrder = await Order.findById(transaction.order);
            if (!freshTransaction || !freshOrder) {
              throw new AppError(500, 'Resources were removed during concurrent state locks');
            }

            // Sync transaction payload with gateway status updates
            if (status) {
              freshTransaction.status = status;
            }
            if (gatewayPaymentId) {
              freshTransaction.gatewayPaymentId = gatewayPaymentId;
            }
            freshTransaction.metadata = {
              ...(freshTransaction.metadata || {}),
              reprocessedAt: new Date(),
              reattemptIndex: retryCount,
            };

            if (status === 'CAPTURED') {
              if (freshOrder.paymentStatus === 'PAID') {
                log.info(`Order is already finalized. Bypassing state flow change.`, { orderNumber: freshOrder.orderNumber });
              } else {
                if (freshOrder.status === 'CANCELLED' || freshOrder.status === 'REFUNDED') {
                  throw new AppError(400, `Cannot finalize payment of terminated order: ${freshOrder.status}`);
                }

                // Apply ATOMIC INVENTORY DEDUCTION
                try {
                  const itemsToDeduct = freshOrder.items.map(item => ({ sku: item.sku, quantity: item.quantity }));
                  await deductStockAtomically(itemsToDeduct);
                  freshOrder.inventoryDeducted = true;
                  await freshOrder.save();
                } catch (invError: any) {
                  const isPermanent = invError.statusCode === 400 || 
                                      invError.message?.includes('stock') || 
                                      invError.message?.includes('SKU');

                  if (isPermanent) {
                    freshOrder.status = 'CANCELLED';
                    freshOrder.paymentStatus = 'REFUNDED';
                    freshOrder.inventoryDeducted = false;
                    await freshOrder.save();

                    freshTransaction.status = 'FAILED';
                    freshTransaction.failureReason = `Stock allocation failed: ${invError.message}`;
                    await freshTransaction.save();

                    webhookEvent.status = 'FAILED';
                    webhookEvent.failureReason = `Inventory compensation applied: ${invError.message}`;
                    await webhookEvent.save();

                    // Audit compliance event log
                    await AuditLog.create({
                      action: 'INVENTORY_COMPENSATION',
                      entityType: 'Order',
                      entityId: freshOrder._id.toString(),
                      payload: {
                        orderNumber: freshOrder.orderNumber,
                        error: invError.message,
                        triggeredBy: 'ADMINISTRATIVE_WEBHOOK_REPROCESS_JOB',
                      },
                      reason: 'Automatic cancellation compensation triggered by manual reprocess recovery.',
                    });

                    return;
                  } else {
                    throw invError;
                  }
                }

                // Succeeded! Finalize Order
                freshOrder.paymentStatus = 'PAID';
                freshOrder.status = 'PAID';
                await freshOrder.save();

                freshTransaction.status = 'CAPTURED';
                await freshTransaction.save();

                // Clear Cart
                await Cart.findOneAndUpdate({ user: freshOrder.user }, { $set: { items: [] } });

                // Audit successful capture manually triggered
                await AuditLog.create({
                  action: 'MANUAL_PAYMENT_RECOVERY_CAPTURE',
                  entityType: 'PaymentTransaction',
                  entityId: freshTransaction._id.toString(),
                  payload: {
                    orderNumber: freshOrder.orderNumber,
                    transactionId: freshTransaction.transactionId,
                    gatewayPaymentId: freshTransaction.gatewayPaymentId,
                  },
                  reason: 'Asynchronous payment recovery manually completed by operator.',
                });
              }
            } else if (status === 'FAILED') {
              freshTransaction.status = 'FAILED';
              freshTransaction.failureReason = 'Gateway reported captured failed status.';
              await freshTransaction.save();

              freshOrder.paymentStatus = 'FAILED';
              await freshOrder.save();
            } else {
              await freshTransaction.save();
            }
          });
        }
      }

      if ((webhookEvent.status as string) !== 'FAILED') {
        webhookEvent.status = 'PROCESSED';
        webhookEvent.processedAt = new Date();
        webhookEvent.failureReason = undefined; 
        await webhookEvent.save();
      }

      const durationMs = Date.now() - startTime;

      await PaymentAnalytics.create({
        metricType: 'WEBHOOK_LATENCY',
        latencyMs: durationMs,
        metadata: {
          action: 'administrative_reprocess',
          eventId: id,
          retryCount,
          success: webhookEvent.status === 'PROCESSED',
        },
      });

      log.info(`Administrative webhook reprocessed successfully`, { id, durationMs, status: webhookEvent.status });

      return {
        success: webhookEvent.status === 'PROCESSED',
        status: webhookEvent.status,
        orderId: orderIdStr !== 'N/A' ? orderIdStr : undefined,
        transactionId: txIdStr !== 'N/A' ? txIdStr : undefined,
        message: webhookEvent.status === 'PROCESSED' 
          ? 'Failed webhook event reprocessed and successfully resolved.'
          : 'Failed webhook event reprocessed but inventory depletion triggered compensation auto-cancel.',
      };
    } catch (err: any) {
      log.error(`Reprocessing error for event ${id}`, { error: err.message, retryCount });
      webhookEvent.status = 'FAILED';
      webhookEvent.failureReason = err.message || 'Reprocessing error occurred.';
      await webhookEvent.save();
      throw err;
    }
  }

  /**
   * Retrieves all failed webhooks and dead-letter issues (Section 11)
   */
  async getExceptions() {
    const failedWebhooks = await WebhookEvent.find({ status: 'FAILED' }).sort({ updatedAt: -1 });
    const unprocessedStaleWebhooks = await WebhookEvent.find({
      status: 'RECEIVED',
      createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // Stale for more than 30 mins
    }).sort({ createdAt: -1 });

    const deadLetters = await WebhookEvent.find({
      status: 'FAILED',
      retryCount: { $gt: 3 },
    }).sort({ retryCount: -1 });

    return {
      failedWebhooks,
      unprocessedStaleWebhooks,
      deadLetters,
    };
  }
}
export const webhookRecoveryService = new WebhookRecoveryService();
