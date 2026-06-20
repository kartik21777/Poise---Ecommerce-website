import { WebhookEvent } from '../models/WebhookEvent.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { deductStockAtomically } from '../controllers/orderController.js';
import { AppError } from '../utils/AppError.js';
import { lockService } from './LockService.js';
import { logger } from '../utils/logger.js';
import { AuditLog } from '../models/AuditLog.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';
import { CommissionService } from './CommissionService.js';

const log = logger('WebhookProcessingService');

export class WebhookProcessingService {
  private commissionService: CommissionService;

  constructor() {
    this.commissionService = new CommissionService();
  }

  /**
   * General-use gateway-agnostic webhook processor managing verification, locks, stock and state syncing
   */
  async processGatewayWebhook(gatewayName: string, headers: Record<string, any>, rawBody: string) {
    const startTime = Date.now();
    const gateway = gatewayName.toUpperCase();
    
    // 1. Signature check & packet normalization dynamically
    const provider = paymentProviderRegistry.getProvider(gateway);
    const verification = await provider.verifyWebhook(headers, rawBody);
    if (!verification.isValid) {
      log.warn(`Rejected invalid signature webhook submission from ${gateway}`);
      throw new AppError(400, `Invalid ${gateway} webhook signature verification`);
    }

    const {
      eventId,
      eventType,
      gatewayOrderId,
      gatewayPaymentId,
      status,
      rawPayload,
    } = verification;

    log.info(`Received webhook from gateway ${gateway}`, { eventId, eventType, gatewayOrderId, gatewayPaymentId, status });

    // 2. Replay check & Idempotency boundary
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      if (existingEvent.status === 'PROCESSED') {
        log.info(`Duplicate webhook execution bypassed dynamically`, { eventId });
        return {
          duplicate: true,
          status: 'PROCESSED',
          message: `Webhook event ${eventId} already processed under idempotency protection.`,
        };
      }
      return {
        duplicate: true,
        status: existingEvent.status,
        message: `Webhook event ${eventId} exists with status: ${existingEvent.status}. Ignoring.`,
      };
    }

    // 3. Persist the received event
    const webhookEvent = new WebhookEvent({
      eventId,
      gateway,
      eventType,
      status: 'RECEIVED',
      payload: rawPayload || JSON.parse(rawBody),
    });
    await webhookEvent.save();

    try {
      let orderIdStr = 'N/A';
      let txIdStr = 'N/A';

      // 4. Trace related payment transaction records
      if (gatewayOrderId) {
        const transaction = await PaymentTransaction.findOne({ gatewayOrderId });
        if (transaction) {
          txIdStr = transaction.transactionId;
          const order = await Order.findById(transaction.order);
          if (!order) {
            throw new AppError(404, `Order ${transaction.order} associated with transaction not found.`);
          }
          orderIdStr = order._id.toString();

          // Standardize concurrency protection: wrap inside order state machine lock to prevent concurrent callback collisions
          const lockKey = `lock:payment:order:${orderIdStr}`;
          
          await lockService.withLock(lockKey, 20000, async () => {
            // Re-fetch inside lock to avoid stale state issues!
            const freshTransaction = await PaymentTransaction.findOne({ gatewayOrderId });
            const freshOrder = await Order.findById(transaction.order);
            if (!freshTransaction || !freshOrder) {
              throw new AppError(500, 'Resources were removed during concurrent locking sequences');
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
              lastWebhookEventId: eventId,
              lastWebhookTimestamp: new Date(),
            };

            // If the verified status is CAPTURED, execute finalization
            if (status === 'CAPTURED') {
              // Idempotently check if order is already Paid
              if (freshOrder.paymentStatus === 'PAID') {
                log.info(`Order is already finalized. Bypassing state flow change.`, { orderNumber: freshOrder.orderNumber });
              } else {
                // Enforce state transition safety: Reject final transitions if terminal
                if (freshOrder.status === 'CANCELLED' || freshOrder.status === 'REFUNDED') {
                  throw new AppError(400, `Cannot finalize payment of terminated order: ${freshOrder.status}`);
                }

                // Apply STOCK DEDUCTION
                try {
                  const itemsToDeduct = freshOrder.items.map(item => ({ sku: item.sku, quantity: item.quantity }));
                  await deductStockAtomically(itemsToDeduct);
                  freshOrder.inventoryDeducted = true;
                  await freshOrder.save();
                } catch (invError: any) {
                  // Identify permanent stock allocation failure vs transient timeout
                  const isPermanent = invError.statusCode === 400 || 
                                      invError.message?.includes('stock') || 
                                      invError.message?.includes('SKU');

                  if (isPermanent) {
                    log.error(`Permanent stock allocation failure. Initiating automated auto-cancel rollback.`, { orderNumber: freshOrder.orderNumber, error: invError.message });
                    
                    // Compensation strategy: Cancellations + manual refund queue marker
                    freshOrder.status = 'CANCELLED';
                    freshOrder.paymentStatus = 'REFUNDED'; // Mark as refunded indicating stock compensation refund
                    freshOrder.inventoryDeducted = false;
                    await freshOrder.save();

                    freshTransaction.status = 'FAILED';
                    freshTransaction.failureReason = `Stock allocation failed permanently: ${invError.message}`;
                    await freshTransaction.save();

                    // Mark webhook as processed but save failure metadata for operator visibility
                    webhookEvent.status = 'FAILED';
                    (webhookEvent as any).metadata = {
                      error: invError.message,
                      orderId: freshOrder._id,
                      isCompensated: true,
                      reconciliationNeeded: true,
                    };
                    await webhookEvent.save();

                    // Audit allocation failure
                    await AuditLog.create({
                      action: 'INVENTORY_COMPENSATION',
                      entityType: 'Order',
                      entityId: freshOrder._id.toString(),
                      payload: {
                        orderNumber: freshOrder.orderNumber,
                        error: invError.message,
                      },
                      reason: 'Automatic order cancellation due to permanent stock depletion.',
                    });

                    return;
                  } else {
                    // Transient database connection/lock exception: Throw so gateway retries
                    log.warn(`Transient stock allocation failure. Rethrowing to provoke webhook replay.`, { orderNumber: freshOrder.orderNumber, error: invError.message });
                    throw invError;
                  }
                }

                // Inventory deduction succeeded! Finalize transitions
                freshOrder.paymentStatus = 'PAID';
                freshOrder.status = 'PAID';
                await freshOrder.save();

                await this.commissionService.splitOrder(freshOrder._id);

                freshTransaction.status = 'CAPTURED';
                await freshTransaction.save();

                // Clear user's cart upon successful verified completion
                await Cart.findOneAndUpdate({ user: freshOrder.user }, { $set: { items: [] } });

                // Audit successful capture via webhook
                await AuditLog.create({
                  action: 'WEBHOOK_PAYMENT_CAPTURE',
                  entityType: 'PaymentTransaction',
                  entityId: freshTransaction._id.toString(),
                  payload: {
                    orderNumber: freshOrder.orderNumber,
                    transactionId: freshTransaction.transactionId,
                    gatewayPaymentId: freshTransaction.gatewayPaymentId,
                  },
                  reason: 'Asynchronous payment capture callback ingestion.',
                });
              }
            } else if (status === 'FAILED') {
              // Payment failed scenario (cart and inventory remain untouched)
              freshTransaction.status = 'FAILED';
              freshTransaction.failureReason = verification.failureReason || 'Gateway checkout authorization failed.';
              await freshTransaction.save();

              freshOrder.paymentStatus = 'FAILED';
              await freshOrder.save();
            } else {
              // Just update transaction status details
              await freshTransaction.save();
            }
          });
        }
      }

      // Check if webhookEvent metadata says FAILED from the early return block above
      if (webhookEvent.status !== 'FAILED') {
        webhookEvent.status = 'PROCESSED';
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
      }

      const elapsedMs = Date.now() - startTime;
      
      // Store webhook latency and transaction success metrics
      await PaymentAnalytics.create({
        metricType: 'WEBHOOK_LATENCY',
        latencyMs: elapsedMs,
        metadata: {
          gateway,
          eventId,
          eventType,
          status,
          success: webhookEvent.status === 'PROCESSED',
        },
      });

      log.info(`Handled ${gateway} webhook event successfully`, { eventId, eventType, orderId: orderIdStr, elapsedMs });

      return {
        success: webhookEvent.status === 'PROCESSED',
        eventId,
        eventType,
        orderId: orderIdStr !== 'N/A' ? orderIdStr : undefined,
        transactionId: txIdStr !== 'N/A' ? txIdStr : undefined,
        message: webhookEvent.status === 'PROCESSED' 
          ? 'Webhook signature matched, event completed, order finalized.'
          : 'Webhook signature matched, inventory depletion compensation applied.',
      };
    } catch (error: any) {
      log.error(`Error processing webhook event from ${gateway}`, { eventId, error: error.message });
      webhookEvent.status = 'FAILED';
      webhookEvent.failureReason = error.message || String(error);
      await webhookEvent.save();
      throw new AppError(500, `Webhook execution engine failure: ${error.message || error}`);
    }
  }

  /**
   * Handles incoming Razorpay webhook verification and logging
   */
  async processRazorpayWebhook(headers: Record<string, any>, rawBody: string) {
    return this.processGatewayWebhook('RAZORPAY', headers, rawBody);
  }

  async processRazorpayWebhookLegacy(headers: Record<string, any>, rawBody: string) {
    const startTime = Date.now();
    
    // 1. Signature check & packet normalization dynamically
    const provider = paymentProviderRegistry.getProvider('RAZORPAY');
    const verification = await provider.verifyWebhook(headers, rawBody);
    if (!verification.isValid) {
      log.warn('Rejected invalid signature webhook submission');
      throw new AppError(400, 'Invalid webhook signature verification');
    }

    const {
      eventId,
      eventType,
      gatewayOrderId,
      gatewayPaymentId,
      status,
      rawPayload,
    } = verification;

    log.info(`Received webhook from gateway`, { eventId, eventType, gatewayOrderId, gatewayPaymentId, status });

    // 2. Replay check & Idempotency boundary
    const existingEvent = await WebhookEvent.findOne({ eventId });
    if (existingEvent) {
      if (existingEvent.status === 'PROCESSED') {
        log.info(`Duplicate webhook execution bypassed dynamically`, { eventId });
        return {
          duplicate: true,
          status: 'PROCESSED',
          message: `Webhook event ${eventId} already processed under idempotency protection.`,
        };
      }
      return {
        duplicate: true,
        status: existingEvent.status,
        message: `Webhook event ${eventId} exists with status: ${existingEvent.status}. Ignoring.`,
      };
    }

    // 3. Persist the received event
    const webhookEvent = new WebhookEvent({
      eventId,
      gateway: 'RAZORPAY',
      eventType,
      status: 'RECEIVED',
      payload: rawPayload || JSON.parse(rawBody),
    });
    await webhookEvent.save();

    try {
      let orderIdStr = 'N/A';
      let txIdStr = 'N/A';

      // 4. Trace related payment transaction records
      if (gatewayOrderId) {
        const transaction = await PaymentTransaction.findOne({ gatewayOrderId });
        if (transaction) {
          txIdStr = transaction.transactionId;
          const order = await Order.findById(transaction.order);
          if (!order) {
            throw new AppError(404, `Order ${transaction.order} associated with transaction not found.`);
          }
          orderIdStr = order._id.toString();

          // Standardize concurrency protection: wrap inside order state machine lock to prevent concurrent callback collisions
          const lockKey = `lock:payment:order:${orderIdStr}`;
          
          await lockService.withLock(lockKey, 20000, async () => {
            // Re-fetch inside lock to avoid stale state issues!
            const freshTransaction = await PaymentTransaction.findOne({ gatewayOrderId });
            const freshOrder = await Order.findById(transaction.order);
            if (!freshTransaction || !freshOrder) {
              throw new AppError(500, 'Resources were removed during concurrent locking sequences');
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
              lastWebhookEventId: eventId,
              lastWebhookTimestamp: new Date(),
            };

            // If the verified status is CAPTURED, execute finalization
            if (status === 'CAPTURED') {
              // Idempotently check if order is already Paid
              if (freshOrder.paymentStatus === 'PAID') {
                log.info(`Order is already finalized. Bypassing state flow change.`, { orderNumber: freshOrder.orderNumber });
              } else {
                // Enforce state transition safety: Reject final transitions if terminal
                if (freshOrder.status === 'CANCELLED' || freshOrder.status === 'REFUNDED') {
                  throw new AppError(400, `Cannot finalize payment of terminated order: ${freshOrder.status}`);
                }

                // Apply STOCK DEDUCTION
                try {
                  const itemsToDeduct = freshOrder.items.map(item => ({ sku: item.sku, quantity: item.quantity }));
                  await deductStockAtomically(itemsToDeduct);
                  freshOrder.inventoryDeducted = true;
                  await freshOrder.save();
                } catch (invError: any) {
                  // Identify permanent stock exhaustion vs transient timeout
                  const isPermanent = invError.statusCode === 400 || 
                                      invError.message?.includes('stock') || 
                                      invError.message?.includes('SKU');

                  if (isPermanent) {
                    log.error(`Permanent stock allocation failure. Initiating automated auto-cancel rollback.`, { orderNumber: freshOrder.orderNumber, error: invError.message });
                    
                    // Compensation strategy: Cancellations + manual refund queue marker
                    freshOrder.status = 'CANCELLED';
                    freshOrder.paymentStatus = 'REFUNDED'; // Mark as refunded indicating stock compensation refund
                    freshOrder.inventoryDeducted = false;
                    await freshOrder.save();

                    freshTransaction.status = 'FAILED';
                    freshTransaction.failureReason = `Stock allocation failed permanently: ${invError.message}`;
                    await freshTransaction.save();

                    // Mark webhook as processed but save failure metadata for operator visibility
                    webhookEvent.status = 'FAILED';
                    (webhookEvent as any).metadata = {
                      error: invError.message,
                      orderId: freshOrder._id,
                      isCompensated: true,
                      reconciliationNeeded: true,
                    };
                    await webhookEvent.save();

                    // Audit allocation failure
                    await AuditLog.create({
                      action: 'INVENTORY_COMPENSATION',
                      entityType: 'Order',
                      entityId: freshOrder._id.toString(),
                      payload: {
                        orderNumber: freshOrder.orderNumber,
                        error: invError.message,
                      },
                      reason: 'Automatic order cancellation due to permanent stock depletion.',
                    });

                    return;
                  } else {
                    // Transient database connection/lock exception: Throw so Razorpay retries
                    log.warn(`Transient stock allocation failure. Rethrowing to provoke webhook replay.`, { orderNumber: freshOrder.orderNumber, error: invError.message });
                    throw invError;
                  }
                }

                // Inventory deduction succeeded! Finalize transitions
                freshOrder.paymentStatus = 'PAID';
                freshOrder.status = 'PAID';
                await freshOrder.save();
                
                await this.commissionService.splitOrder(freshOrder._id);

                freshTransaction.status = 'CAPTURED';
                await freshTransaction.save();

                // Clear user's cart upon successful verified completion
                await Cart.findOneAndUpdate({ user: freshOrder.user }, { $set: { items: [] } });

                // Audit successful capture via webhook
                await AuditLog.create({
                  action: 'WEBHOOK_PAYMENT_CAPTURE',
                  entityType: 'PaymentTransaction',
                  entityId: freshTransaction._id.toString(),
                  payload: {
                    orderNumber: freshOrder.orderNumber,
                    transactionId: freshTransaction.transactionId,
                    gatewayPaymentId: freshTransaction.gatewayPaymentId,
                  },
                  reason: 'Asynchronous payment capture callback ingestion.',
                });
              }
            } else if (status === 'FAILED') {
              // Payment failed scenario (cart and inventory remain untouched)
              freshTransaction.status = 'FAILED';
              freshTransaction.failureReason = verification.failureReason || 'Gateway checkout authorization failed.';
              await freshTransaction.save();

              freshOrder.paymentStatus = 'FAILED';
              await freshOrder.save();
            } else {
              // Just update transaction status details
              await freshTransaction.save();
            }
          });
        }
      }

      // Check if webhookEvent metadata says FAILED from the early return block above
      if (webhookEvent.status !== 'FAILED') {
        webhookEvent.status = 'PROCESSED';
        webhookEvent.processedAt = new Date();
        await webhookEvent.save();
      }

      const elapsedMs = Date.now() - startTime;
      
      // Store webhook latency and transaction success metrics
      await PaymentAnalytics.create({
        metricType: 'WEBHOOK_LATENCY',
        latencyMs: elapsedMs,
        metadata: {
          gateway: 'RAZORPAY',
          eventId,
          eventType,
          status,
          success: webhookEvent.status === 'PROCESSED',
        },
      });

      log.info(`Handled webhook event successfully`, { eventId, eventType, orderId: orderIdStr, elapsedMs });

      return {
        success: webhookEvent.status === 'PROCESSED',
        eventId,
        eventType,
        orderId: orderIdStr !== 'N/A' ? orderIdStr : undefined,
        transactionId: txIdStr !== 'N/A' ? txIdStr : undefined,
        message: webhookEvent.status === 'PROCESSED' 
          ? 'Webhook signature matched, event completed, order finalized.'
          : 'Webhook signature matched, inventory depletion compensation applied.',
      };
    } catch (error: any) {
      log.error(`Error processing webhook event`, { eventId, error: error.message });
      webhookEvent.status = 'FAILED';
      webhookEvent.failureReason = error.message || String(error);
      await webhookEvent.save();
      throw new AppError(500, `Webhook execution engine failure: ${error.message || error}`);
    }
  }
}
