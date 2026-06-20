import { Order } from '../models/Order.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { RefundTransaction } from '../models/RefundTransaction.js';
import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { AppError } from '../utils/AppError.js';
import { lockService } from './LockService.js';
import { logger } from '../utils/logger.js';
import { AuditLog } from '../models/AuditLog.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';

const log = logger('ReconciliationService');

export interface ReconciliationResult {
  orderNumber?: string;
  orderId?: string;
  transactionId?: string;
  gatewayPaymentId?: string;
  severity: 'MATCHED' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type: string;
  message: string;
  recommendedAction: string;
}

export class ReconciliationService {
  // decoulped constructor
  constructor() {}

  /**
   * Run multi-system deep reconciliation checks with concurrency safety and audit trail
   */
  async runReconciliation(filterOrderDays: number = 30): Promise<ReconciliationResult[]> {
    const lockKey = 'lock:reconciliation:job';
    const lockHolder = await lockService.acquireLock(lockKey, 300000); // 5 minutes TTL lock for reconciliation

    if (!lockHolder) {
      log.warn('Reconciliation run request bypassed: Another reconciliation job instance is currently active lock.');
      return [
        {
          severity: 'WARNING',
          type: 'RECONCILIATION_LOCK_COORDINATION',
          message: 'Another reconciliation operation is already actively scanning transactions. This request was cataloged and bypassed to avoid database N+1 exhaustion.',
          recommendedAction: 'Retry in 5 minutes or consult structured operational logs.',
        },
      ];
    }

    const startTime = Date.now();
    log.info(`Launching automated multi-system deep reconciliation checks`, { filterOrderDays });

    try {
      const findings: ReconciliationResult[] = [];

      // Gather orders created within sliding window
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - filterOrderDays);

      const orders = await Order.find({ createdAt: { $gte: sinceDate } })
        .populate('user', 'name email');

      for (const order of orders) {
        const orderIdStr = order._id.toString();
        const orderNumber = order.orderNumber;

        // 1. Fetch transactions for order
        const localTxs = await PaymentTransaction.find({ order: order._id });
        const capturedTxs = localTxs.filter(t => t.status === 'CAPTURED');

        // Check final status matching
        const isOrderPaidStatus = order.paymentStatus === 'PAID';
        
        // Look for: "Finalized but not captured"
        if (isOrderPaidStatus && capturedTxs.length === 0) {
          findings.push({
            orderId: orderIdStr,
            orderNumber,
            severity: 'CRITICAL',
            type: 'FINALIZED_BUT_NOT_CAPTURED',
            message: `Order ${orderNumber} is marked PAID, but no local transaction has a CAPTURED status.`,
            recommendedAction: 'Verify gateway settlement logs immediately and capture payment metadata.',
          });
          continue;
        }

        // Look for: "Paid but not finalized / Missing finalizations"
        const hasCapturedTx = capturedTxs.length > 0;
        if (hasCapturedTx && !isOrderPaidStatus) {
          findings.push({
            orderId: orderIdStr,
            orderNumber,
            transactionId: capturedTxs[0].transactionId,
            gatewayPaymentId: capturedTxs[0].gatewayPaymentId,
            severity: 'CRITICAL',
            type: 'PAID_BUT_NOT_FINALIZED',
            message: `Payment is CAPTURED in transaction ${capturedTxs[0].transactionId}, but Order status is unpaid ("${order.paymentStatus}").`,
            recommendedAction: 'Trigger manual webhook recovery or run finalization callback on this order.',
          });
        }

        // Look for: "Duplicate captures" (double-charging safety checks)
        if (capturedTxs.length > 1) {
          findings.push({
            orderId: orderIdStr,
            orderNumber,
            severity: 'CRITICAL',
            type: 'DUPLICATE_CAPTURES_DETECTED',
            message: `Multiple captured payment records discovered for Order ${orderNumber} (Count: ${capturedTxs.length}).`,
            recommendedAction: 'Analyze capture audit traces immediately. Issue refunds for duplicate charge events.',
          });
        }

        // Verify Gateway settlement mismatches dynamically (where applicable)
        for (const tx of localTxs) {
          if (tx.gatewayPaymentId && ['RAZORPAY', 'STRIPE'].includes(tx.gateway)) {
            try {
              // Attempt remote verification dynamically with resolved provider
              const provider = paymentProviderRegistry.getProvider(tx.gateway);
              const remoteDetails = await provider.fetchPayment(tx.gatewayPaymentId);
              
              // Look for: "Orphaned Transactions" (Gateway says captured, local database says failed/expired)
              if (remoteDetails.status === 'CAPTURED' && tx.status !== 'CAPTURED') {
                findings.push({
                  orderId: orderIdStr,
                  orderNumber,
                  transactionId: tx.transactionId,
                  gatewayPaymentId: tx.gatewayPaymentId,
                  severity: 'CRITICAL',
                  type: 'GATEWAY_LOCAL_STATE_MISMATCH_CAPTURE',
                  message: `Gateway indicates payment was CAPTURED for ${tx.gatewayPaymentId}, but local transaction states "${tx.status}".`,
                  recommendedAction: 'Audit order items and capture state. Update local status to CAPTURED via manual repair.',
                });
              } else if (remoteDetails.status === 'FAILED' && tx.status === 'CAPTURED') {
                findings.push({
                  orderId: orderIdStr,
                  orderNumber,
                  transactionId: tx.transactionId,
                  gatewayPaymentId: tx.gatewayPaymentId,
                  severity: 'ERROR',
                  type: 'LOCAL_CAPTURED_BUT_GATEWAY_FAILED',
                  message: `Local record indicates CAPTURED for transaction ${tx.transactionId}, but ${tx.gateway} returns FAILED.`,
                  recommendedAction: 'Investigate potential spoofing attempts or webhook payload contamination.',
                });
              }

              // Look for: "Amount mismatches"
              if (remoteDetails.amount !== tx.amount) {
                findings.push({
                  orderId: orderIdStr,
                  orderNumber,
                  transactionId: tx.transactionId,
                  gatewayPaymentId: tx.gatewayPaymentId,
                  severity: 'CRITICAL',
                  type: 'PAYMENT_AMOUNT_MISMATCH',
                  message: `Discrepancy in recorded gateway amount: Local ₹${tx.amount} vs Gateway ₹${remoteDetails.amount}.`,
                  recommendedAction: 'Halt dispatching immediately. Confirm real billing invoice numbers.',
                });
              }
            } catch (apiErr: any) {
              // Log issues connectively but do not abort audit, default to warnings for credentials issue
              log.warn(`Dynamic details query bypassed or failed for ${tx.gatewayPaymentId}`, { error: apiErr.message });
            }
          }
        }

        // 2. Fetch refund transaction mismatches
        const localRefunds = await RefundTransaction.find({ order: order._id, status: 'COMPLETED' });
        const refundSum = localRefunds.reduce((sum, rf) => sum + rf.amount, 0);
        const metadataRefunded = (order as any).metadata?.totalRefunded || 0;

        if (refundSum !== metadataRefunded) {
          findings.push({
            orderId: orderIdStr,
            orderNumber,
            severity: 'ERROR',
            type: 'REFUND_METADATA_MISMATCH',
            message: `Refund accumulation mismatch on Order ${orderNumber}: Cumulative completed refund rows total ₹${refundSum}, but Order metadata tracks ₹${metadataRefunded}.`,
            recommendedAction: 'Recalculate entire historical refund ledger for order, then apply structural update on the outer order metadata.',
          });
        }

        // If everything passes, flag a perfect matched status
        if (findings.filter(f => f.orderId === orderIdStr).length === 0) {
          findings.push({
            orderId: orderIdStr,
            orderNumber,
            severity: 'MATCHED',
            type: 'SYSTEM_CONSISTENCE_PASSED',
            message: `Order, local transaction attempts, and gateway nodes are completely synced and aligned.`,
            recommendedAction: 'No actions required.',
          });
        }
      }

      // Capture orphaned standalone transactions in the platform database with no valid order reference
      const orphanTxs = await PaymentTransaction.find({
        $or: [
          { order: { $exists: false } },
          { order: null },
        ]
      }).populate('user', 'name email');

      for (const orphan of orphanTxs) {
        findings.push({
          transactionId: orphan.transactionId,
          gatewayPaymentId: orphan.gatewayPaymentId,
          severity: 'ERROR',
          type: 'ORPHANED_TRANSACTION_LOG',
          message: `Standalone transaction attempt ${orphan.transactionId} has no attached parent e-commerce order link.`,
          recommendedAction: 'Locate user session variables, find missing drafts, or archive transaction.',
        });
      }

      const latencyMs = Date.now() - startTime;
      const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
      const errorCount = findings.filter(f => f.severity === 'ERROR').length;
      const warningCount = findings.filter(f => f.severity === 'WARNING').length;

      // Append logs to the compliance audit ledger and analytics databases
      await AuditLog.create({
        action: 'RECONCILIATION_RUN',
        entityType: 'ReconciliationResult',
        entityId: `rec_job_${startTime}`,
        payload: {
          scannedOrdersCount: orders.length,
          findingsCount: findings.length,
          criticalCount,
          errorCount,
          warningCount,
          latencyMs,
        },
        reason: 'Automated sliding window reconciliation run audits',
        correlationId: lockHolder,
      });

      await PaymentAnalytics.create({
        metricType: 'WEBHOOK_LATENCY', // using latency recording slot
        latencyMs,
        metadata: {
          action: 'reconciliation_run',
          scannedOrdersCount: orders.length,
          findingsCount: findings.length,
          criticalCount,
          errorCount,
        }
      });

      log.info(`Automated reconciliation finished successfully`, { 
        elapsedMs: latencyMs, 
        findingsCount: findings.length, 
        criticalCount, 
        errorCount 
      });

      return findings;
    } catch (err: any) {
      log.error(`Exception occurred inside reconciliation processing`, { error: err.message });
      throw err;
    } finally {
      await lockService.releaseLock(lockKey, lockHolder);
    }
  }
}
export const reconciliationService = new ReconciliationService();
