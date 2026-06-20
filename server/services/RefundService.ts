import mongoose from 'mongoose';
import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { RefundTransaction, RefundTransactionStatus } from '../models/RefundTransaction.js';
import { IdempotencyKey } from '../models/IdempotencyKey.js';
import { GiftCard } from '../models/GiftCard.js';
import { GiftCardTransaction } from '../models/GiftCardTransaction.js';
import { giftCardCreditService } from './GiftCardCreditService.js';
import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { PaymentProvider } from './PaymentProvider.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { lockService } from './LockService.js';
import { AuditLog } from '../models/AuditLog.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';

const log = logger('RefundService');

export class RefundService {
  private getProvider(gateway: string): PaymentProvider {
    return paymentProviderRegistry.getProvider(gateway);
  }

  /**
   * Safe State Transition Rule Guard for RefundTransaction
   */
  private validateStateTransition(current: RefundTransactionStatus, target: RefundTransactionStatus) {
    if (current === 'COMPLETED' && target === 'PROCESSING') {
      throw new AppError(400, `State transition error: Cannot move COMPLETED refund back to PROCESSING.`);
    }
    if (current === 'FAILED' && target === 'COMPLETED') {
      throw new AppError(400, `State transition error: Cannot complete a FAILED refund directly. A retry attempt must be initiated.`);
    }
    if ((current as any) === 'CANCELLED' && target === 'COMPLETED') {
      throw new AppError(400, `State transition error: Cannot move CANCELLED state to COMPLETED.`);
    }
  }

  /**
   * Executes refund logic idempotently with concurrency locks and audit logging
   */
  async executeRefund(params: {
    paymentTransactionId: string;
    amount: number;
    reason?: string;
    idempotencyKey?: string;
    operatorUserId?: string; // Optional admin ID who initiated this action
  }) {
    const { paymentTransactionId, amount, reason, idempotencyKey, operatorUserId } = params;
    const lockKey = `lock:refund:payment:${paymentTransactionId}`;

    return await lockService.withLock(lockKey, 15000, async () => {
      log.info(`Executing refund operation sequence`, { paymentTransactionId, amount, reason });

      // 1. Enforce Idempotency setup if key is supplied
      const finalIdempotencyKey = idempotencyKey || `refund_idemp_${paymentTransactionId}_${amount}`;
      let idempotencyRecord = await IdempotencyKey.findOne({ key: finalIdempotencyKey });

      if (idempotencyRecord) {
        if (idempotencyRecord.status === 'PENDING') {
          log.warn(`Refund attempt blocked by active idempotency lock`, { finalIdempotencyKey });
          throw new AppError(409, 'A refund operation with this transaction and amount is currently processing. Please wait.');
        }
        if (idempotencyRecord.status === 'COMPLETED') {
          log.info(`Returning cached refund execution response via idempotency key`, { finalIdempotencyKey });
          return idempotencyRecord.responseBody;
        }
      } else {
        idempotencyRecord = new IdempotencyKey({
          key: finalIdempotencyKey,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours TTL lock
        });
        await idempotencyRecord.save();
      }

      try {
        // 2. Locate payment transaction records
        const tx = await PaymentTransaction.findById(paymentTransactionId);
        if (!tx) {
          throw new AppError(404, `Payment transaction ${paymentTransactionId} not found.`);
        }

        // 3. Locate associate Order
        const order = await Order.findById(tx.order);
        if (!order) {
          throw new AppError(404, `Associated order with ID ${tx.order} not found.`);
        }

        // 4. Strict Validations (Section 2)
        if (tx.status !== 'CAPTURED') {
          throw new AppError(400, `Only captured payments can be refunded. Current transaction status: ${tx.status}`);
        }

        if (amount <= 0) {
          throw new AppError(400, 'Refund amount must be greater than zero.');
        }

        // Calculate cumulative refund sums so far to prevent refund overflows (Section 4)
        const existingRefunds = await RefundTransaction.find({
          paymentTransaction: tx._id,
          status: { $in: ['COMPLETED', 'PROCESSING', 'REQUESTED'] },
        });

        const totalRefundedSoFar = existingRefunds.reduce((sum, item) => sum + item.amount, 0);
        const remainingRefundableAmount = Number((tx.amount - totalRefundedSoFar).toFixed(2));

        if (amount > remainingRefundableAmount) {
          throw new AppError(
            400,
            `Over-Refund Prevented: Requested refund amount ₹${amount} exceeds remaining refundable balance of ₹${remainingRefundableAmount} (Captured ₹${tx.amount}, Refunded ₹${totalRefundedSoFar}).`
          );
        }

        // 5. Initialize the RefundTransaction document
        const refundId = `rf_${crypto.randomBytes(8).toString('hex')}`;
        const refundRecord = new RefundTransaction({
          refundId,
          order: order._id,
          paymentTransaction: tx._id,
          amount,
          currency: tx.currency || order.currency || 'USD',
          exchangeRateUsed: (tx as any).exchangeRateUsed || order.exchangeRateUsed || 1.0,
          exchangeRateVersion: (tx as any).exchangeRateVersion || order.exchangeRateVersion,
          reason: reason || 'Merchant Direct Administration Refund',
          status: 'REQUESTED' as RefundTransactionStatus,
        });
        await refundRecord.save();

        // Update state to PROCESSING
        this.validateStateTransition(refundRecord.status, 'PROCESSING');
        refundRecord.status = 'PROCESSING';
        await refundRecord.save();

        // 6. Invoke refund via payment provider abstraction
        const provider = this.getProvider(tx.gateway);
        if (!tx.gatewayPaymentId) {
          throw new AppError(400, 'Gateway Payment ID is missing on the transaction. Cannot execute refund at gateway.');
        }

        let providerResponse;
        const startTime = Date.now();
        try {
          providerResponse = await provider.refundPayment(tx.gatewayPaymentId, amount, reason);
        } catch (gatewayErr: any) {
          log.error(`Gateway execution error for Refund ${refundId}`, { error: gatewayErr.message, refundId });
          
          refundRecord.status = 'FAILED';
          await refundRecord.save();

          idempotencyRecord.status = 'FAILED';
          idempotencyRecord.responseBody = {
            success: false,
            refundId,
            status: 'FAILED',
            message: `Gateway rejected refund processing: ${gatewayErr.message || gatewayErr}`,
          };
          idempotencyRecord.responseStatus = 502;
          await idempotencyRecord.save();

          // Log failure transaction as immutable auditor trace
          await AuditLog.create({
            user: operatorUserId ? new mongoose.Types.ObjectId(operatorUserId) : undefined,
            action: 'REFUND_FAILED',
            entityType: 'RefundTransaction',
            entityId: refundRecord._id.toString(),
            payload: {
              paymentTransactionId,
              amount,
              gateway: tx.gateway,
              gatewayPaymentId: tx.gatewayPaymentId,
              error: gatewayErr.message || String(gatewayErr),
            },
            reason: reason || 'Merchant Direct Administration Refund Retry',
            correlationId: finalIdempotencyKey,
          });

          await PaymentAnalytics.create({
            metricType: 'PAYMENT_FAILURE',
            amount,
            gateway: tx.gateway,
            orderId: order._id,
            transactionId: tx.transactionId,
            metadata: {
              phase: 'refund_gateway_rejection',
              refundId,
              error: gatewayErr.message,
            },
          });

          return idempotencyRecord.responseBody;
        }
        const latencyMs = Date.now() - startTime;

        // 7. Success state transformation handling
        const targetStatus: RefundTransactionStatus = providerResponse.status as RefundTransactionStatus;
        this.validateStateTransition(refundRecord.status, targetStatus);
        
        refundRecord.status = targetStatus;
        if (providerResponse.gatewayRefundId) {
          refundRecord.gatewayRefundId = providerResponse.gatewayRefundId;
        }
        await refundRecord.save();

        if (targetStatus === 'COMPLETED') {
          // Update Order's cumulative refund numbers
          const finalRefundedCount = totalRefundedSoFar + amount;
          
          if (finalRefundedCount >= tx.amount) {
            order.paymentStatus = 'REFUNDED';
            order.status = 'REFUNDED';
            tx.status = 'REFUNDED';
          } else {
            (order as any).paymentStatus = 'PARTIALLY_REFUNDED';
          }

          (order as any).metadata = {
            ...((order as any).metadata || {}),
            totalRefunded: finalRefundedCount,
            lastRefundId: refundId,
            lastRefundTimestamp: new Date(),
          };
          await order.save();

          tx.metadata = {
            ...(tx.metadata || {}),
            totalRefunded: finalRefundedCount,
            refunds: [
              ...(tx.metadata?.refunds || []),
              { refundId, gatewayRefundId: providerResponse.gatewayRefundId, amount, response: providerResponse.rawResponse },
            ],
          };
          await tx.save();

          // Append audit logs and analytics track points
          await AuditLog.create({
            user: operatorUserId ? new mongoose.Types.ObjectId(operatorUserId) : undefined,
            action: 'REFUND_COMPLETED',
            entityType: 'RefundTransaction',
            entityId: refundRecord._id.toString(),
            payload: {
              paymentTransactionId,
              amount,
              gateway: tx.gateway,
              gatewayPaymentId: tx.gatewayPaymentId,
              gatewayRefundId: providerResponse.gatewayRefundId,
              orderId: order._id,
            },
            reason: reason || 'Merchant Direct Administration Refund',
            correlationId: finalIdempotencyKey,
          });

          await PaymentAnalytics.create({
            metricType: 'REFUND_COMPLETED',
            amount,
            gateway: tx.gateway,
            orderId: order._id,
            transactionId: tx.transactionId,
            latencyMs,
            metadata: {
              refundId,
              gatewayRefundId: providerResponse.gatewayRefundId,
            },
          });
        }

        const responsePayload = {
          success: targetStatus === 'COMPLETED',
          refundId,
          gatewayRefundId: refundRecord.gatewayRefundId,
          amount,
          status: refundRecord.status,
          message: targetStatus === 'COMPLETED' ? 'Refund successfully resolved and recorded.' : 'Refund is currently processing at the gateway.',
        };

        idempotencyRecord.status = 'COMPLETED';
        idempotencyRecord.responseBody = responsePayload;
        idempotencyRecord.responseStatus = 200;
        await idempotencyRecord.save();

        log.info(`Refund transaction finished executing`, { refundId, status: refundRecord.status, amount });
        return responsePayload;
      } catch (error: any) {
        log.error('Error during executeRefund transaction logic', { error: error.message });
        idempotencyRecord.status = 'FAILED';
        idempotencyRecord.responseBody = {
          success: false,
          message: error.message || 'Refund orchestration failed.',
        };
        idempotencyRecord.responseStatus = error.statusCode || 500;
        await idempotencyRecord.save();
        throw error;
      }
    });
  }

  /**
   * Retries a FAILED refund transaction safely
   */
  async retryFailedRefund(refundTransactionId: string) {
    const refundRecord = await RefundTransaction.findById(refundTransactionId);
    if (!refundRecord) {
      throw new AppError(404, `Refund record ${refundTransactionId} not found.`);
    }

    if (refundRecord.status !== 'FAILED') {
      throw new AppError(400, `Only FAILED refund transactions can be retried. Current status is ${refundRecord.status}`);
    }

    // Call execution again with a clean generated unique key
    const uniqueKey = `refund_retry_${refundTransactionId}_${Date.now()}`;
    return await this.executeRefund({
      paymentTransactionId: refundRecord.paymentTransaction.toString(),
      amount: refundRecord.amount,
      reason: `RETRY UN-RESOLVED: ${refundRecord.reason}`,
      idempotencyKey: uniqueKey,
    });
  }

  /**
   * Section 5 & 5.6 - Executes order-wide mixed-source refunds deterministically
   */
  async executeMixedRefund(params: {
    orderId: string;
    refundAmount: number;
    reason?: string;
    operatorUserId?: string;
  }): Promise<{
    success: boolean;
    refundId: string;
    distribution: any;
  }> {
    const { orderId, refundAmount, reason, operatorUserId } = params;
    const lockKey = `lock:refund:order:${orderId}`;

    return await lockService.withLock(lockKey, 25000, async () => {
      log.info(`Executing mixed refund logic for order`, { orderId, refundAmount });

      if (refundAmount <= 0) {
        throw new AppError(400, 'Refund amount must be positive.');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError(404, `Order with ID ${orderId} not found.`);
      }

      // 1. Calculate maximum order refund limit
      const currentRefunded = Number((order as any).metadata?.totalRefunded || 0);
      const remainingRefundable = Number((order.total - currentRefunded).toFixed(4));

      if (refundAmount > remainingRefundable) {
        throw new AppError(
          400,
          `Over-Refund Prevented: Requested refund ${order.currency} ${refundAmount} exceeds remaining order refundable limit of ${order.currency} ${remainingRefundable} (Total ${order.total}, Refunded so far ${currentRefunded}).`
        );
      }

      // 2. Map original sources snapshots
      const allocatedGateway = order.gatewayAmountUsed || 0;
      const allocatedStoreCredit = order.storeCreditUsed || 0;
      const allocatedGiftCards = (order.giftCardAllocations || []).map(gc => ({
        giftCardId: gc.giftCardId.toString(),
        code: gc.code,
        amount: gc.amount,
      }));

      // 3. Fetch completed refund transactions to calculate historical source breakdowns
      const existingRefunds = await RefundTransaction.find({
        order: order._id,
        status: 'COMPLETED',
      });

      let alreadyRefundedGateway = 0;
      let alreadyRefundedStoreCredit = 0;
      const alreadyRefundedGiftCards: Record<string, number> = {};

      for (const ref of existingRefunds) {
        alreadyRefundedGateway += ref.gatewayRefundAmount || 0;
        alreadyRefundedStoreCredit += ref.storeCreditRefundAmount || 0;
        if (ref.giftCardRefundAllocations) {
          for (const alloc of ref.giftCardRefundAllocations) {
            const gcId = alloc.giftCardId.toString();
            alreadyRefundedGiftCards[gcId] = (alreadyRefundedGiftCards[gcId] || 0) + alloc.amount;
          }
        }
      }

      // 3.5. Estimate maximum primary sources. Remaining goes to points (Section 7)
      const maxGatewayRefundable = Math.max(0, allocatedGateway - alreadyRefundedGateway);
      const maxStoreCreditRefundable = Math.max(0, allocatedStoreCredit - alreadyRefundedStoreCredit);
      
      let totGiftCardAlloc = 0;
      for (const gc of allocatedGiftCards) {
        totGiftCardAlloc += gc.amount;
      }
      let totGiftCardAlreadyRefunded = 0;
      for (const gcId in alreadyRefundedGiftCards) {
        totGiftCardAlreadyRefunded += alreadyRefundedGiftCards[gcId];
      }
      const maxGiftCardRefundable = Math.max(0, totGiftCardAlloc - totGiftCardAlreadyRefunded);
      
      const primarySourcesMaxRefundable = maxGatewayRefundable + maxStoreCreditRefundable + maxGiftCardRefundable;
      
      let loyaltyAmountRefund = 0;
      let primaryRefundRequest = refundAmount;

      if (refundAmount > primarySourcesMaxRefundable) {
        loyaltyAmountRefund = Number((refundAmount - primarySourcesMaxRefundable).toFixed(4));
        primaryRefundRequest = primarySourcesMaxRefundable;
      }

      // 4. Calculate distribution using priority rules (Gateway -> Store Credit -> Gift Cards)
      const distribution = giftCardCreditService.calculateRefundDistribution({
        refundAmount: primaryRefundRequest,
        orderTotal: order.total,
        allocatedGateway,
        allocatedStoreCredit,
        allocatedGiftCards,
        alreadyRefundedGateway,
        alreadyRefundedStoreCredit,
        alreadyRefundedGiftCards,
      });

      // Calculate loyalty point restorations
      let loyaltyPointsRefundPoints = 0;
      if (loyaltyAmountRefund > 0 && order.loyaltyAmountUsed && order.loyaltyAmountUsed > 0 && order.loyaltyPointsUsed) {
        loyaltyPointsRefundPoints = Math.round(loyaltyAmountRefund * (order.loyaltyPointsUsed / order.loyaltyAmountUsed));
        
        const pointsAlreadyRefunded = existingRefunds.reduce((tot, rt) => tot + (rt.loyaltyPointsRefundAmount || 0), 0);
        const remainingPointsRefundable = order.loyaltyPointsUsed - pointsAlreadyRefunded;

        if (loyaltyPointsRefundPoints > remainingPointsRefundable) {
          loyaltyPointsRefundPoints = remainingPointsRefundable;
        }
      }

      // Calculate earned customer points to revoke
      let pointsToRevoke = 0;
      try {
        const { LoyaltyTransaction, LoyaltyTxType } = await import('../models/LoyaltyTransaction.js');
        const originalEarnTx = await LoyaltyTransaction.findOne({
          orderId: order._id,
          type: LoyaltyTxType.EARN,
        });

        if (originalEarnTx && originalEarnTx.amount > 0) {
          pointsToRevoke = Math.round((refundAmount / order.total) * originalEarnTx.amount);
          const pointsAlreadyRevoked = existingRefunds.reduce((tot, rt) => tot + (rt.pointsEarnedRevoked || 0), 0);
          const remainingPointsRevocable = originalEarnTx.amount - pointsAlreadyRevoked;

          if (pointsToRevoke > remainingPointsRevocable) {
            pointsToRevoke = remainingPointsRevocable;
          }
        }
      } catch (err) {
        log.error('Error calculating earned points to revoke:', err);
      }

      log.info(`Calculated refund distribution`, { distribution, loyaltyAmountRefund, loyaltyPointsRefundPoints, pointsToRevoke });

      const refundId = `rf_${crypto.randomBytes(8).toString('hex')}`;
      let mainPaymentTxId: string | undefined;

      // 5. If Gateway refund is required, process it at the payment provider
      if (distribution.gatewayRefundAmount > 0) {
        const tx = await PaymentTransaction.findOne({ order: order._id, status: 'CAPTURED' });
        if (!tx) {
          throw new AppError(400, 'Gateway refund was allocated, but no captured gateway transaction was found for this order.');
        }
        mainPaymentTxId = tx._id.toString();

        if (!tx.gatewayPaymentId) {
          throw new AppError(400, 'Gateway payment ID is missing. Cannot execute gateway refund.');
        }

        const provider = this.getProvider(tx.gateway);
        log.info(`Triggering gateway refund`, { gateway: tx.gateway, amt: distribution.gatewayRefundAmount });
        
        try {
          const providerResponse = await provider.refundPayment(tx.gatewayPaymentId, distribution.gatewayRefundAmount, reason);
          if (providerResponse.status !== 'COMPLETED') {
            throw new AppError(500, 'Gateway refund pending/failed at the provider.');
          }
        } catch (err: any) {
          throw new AppError(502, `Merchant gateway rejected refund request: ${err.message}`);
        }
      }

      // 6. If Store Credit refund is allocated, credit back to customer's Ledger
      if (distribution.storeCreditRefundAmount > 0) {
        log.info(`Crediting back store credit refund`, { amt: distribution.storeCreditRefundAmount });
        await giftCardCreditService.creditStoreCredit({
          userId: order.user.toString(),
          amount: distribution.storeCreditRefundAmount,
          currency: order.currency,
          refundId,
          notes: `Store Credit refund for order ${order.orderNumber}.`,
          performedBy: operatorUserId || 'SYSTEM',
        });
      }

      // 7. If Gift Card refund is allocated, reload the gift cards
      const giftCardTransactionsCreated: any[] = [];
      const ratesVersion = await giftCardCreditService.convertCurrency === undefined 
        ? null 
        : await giftCardCreditService['exchangeRateService'].getLatestRates();

      if (distribution.giftCardRefunds.length > 0) {
        for (const gcRefund of distribution.giftCardRefunds) {
          log.info(`Reloading gift card refund`, { code: gcRefund.code, amt: gcRefund.refundAmount });
          const card = await GiftCard.findById(gcRefund.giftCardId);
          if (!card) {
            throw new AppError(404, `Gift card allocated for refund (${gcRefund.code}) not found.`);
          }

          // Enforce conversion if gift card has a different native currency
          const refundInCardCurrency = giftCardCreditService.convertCurrency(
            gcRefund.refundAmount,
            order.currency,
            card.currency,
            ratesVersion || { rates: [] }
          );

          card.balance = Number((card.balance + refundInCardCurrency).toFixed(4));
          if (card.status === 'REDEEMED' || card.status === 'EXPIRED') {
            card.status = 'ACTIVE';
          }
          await card.save();

          // Write ledger transaction
          const gcLedger = await GiftCardTransaction.create({
            giftCard: card._id,
            type: 'REFUND',
            amount: refundInCardCurrency,
            currency: card.currency,
            orderId: order._id,
            note: `Refund processing for Order: ${order.orderNumber}`,
            performedBy: operatorUserId || 'SYSTEM',
          });
          giftCardTransactionsCreated.push(gcLedger._id);
        }
      }

      // 8. Put together final RefundTransaction record
      let paymentTxIdObj: mongoose.Types.ObjectId | undefined;
      if (mainPaymentTxId) {
        paymentTxIdObj = new mongoose.Types.ObjectId(mainPaymentTxId);
      } else {
        // Safe fall back if order is only checkout credits/gift cards
        const anyTx = await PaymentTransaction.findOne({ order: order._id });
        if (anyTx) {
          paymentTxIdObj = anyTx._id;
        } else {
          // If pure-credit order, create a placeholder PaymentTransaction ref if nullable doesn't fit
          paymentTxIdObj = order._id; // Use order ID as fallback reference
        }
      }

      const ratesVer = await giftCardCreditService['exchangeRateService'].getLatestRates();
      const refundRecord = await RefundTransaction.create({
        refundId,
        order: order._id,
        paymentTransaction: paymentTxIdObj,
        amount: refundAmount,
        currency: order.currency,
        exchangeRateUsed: order.exchangeRateUsed,
        exchangeRateVersion: order.exchangeRateVersion || ratesVer.versionNumber,
        reason: reason || 'Mixed multi-payment refund',
        status: 'COMPLETED',
        gatewayRefundAmount: distribution.gatewayRefundAmount,
        storeCreditRefundAmount: distribution.storeCreditRefundAmount,
        giftCardRefundAllocations: distribution.giftCardRefunds.map(r => ({
          giftCardId: new mongoose.Types.ObjectId(r.giftCardId),
          code: r.code,
          amount: r.refundAmount,
        })),
        loyaltyPointsRefundAmount: loyaltyPointsRefundPoints,
        loyaltyAmountRefundAmount: loyaltyAmountRefund,
        pointsEarnedRevoked: pointsToRevoke,
      });

      // 8.5. Execute Ledger-level Loyalty restorations, earned rebates clawbacks, and peer rewards rollbacks
      if (loyaltyPointsRefundPoints > 0) {
        const { loyaltyRedemptionService } = await import('./LoyaltyRedemptionService.js');
        await loyaltyRedemptionService.restoreRedeemedPoints({
          userId: order.user.toString(),
          orderId: order._id.toString(),
          refundAmount: loyaltyAmountRefund,
          pointsToRestore: loyaltyPointsRefundPoints,
        });
      }

      if (pointsToRevoke > 0) {
        const { loyaltyEarnService } = await import('./LoyaltyEarnService.js');
        await loyaltyEarnService.revokeEarnedPoints({
          userId: order.user.toString(),
          orderId: order._id.toString(),
          pointsToRevoke,
          refundAmount,
        });

        // Proportionally reverse peer referral rewards if applicable
        try {
          const { loyaltyReferralService } = await import('./LoyaltyReferralService.js');
          await loyaltyReferralService.revokeReferralOnRefund(order._id.toString());
        } catch (refErr: any) {
          log.error('Failed to revoke referral milestone bonus on refund:', refErr.message);
        }
      }

      // 9. Update the Order status & metadata
      const totalRefundedSum = Number((currentRefunded + refundAmount).toFixed(4));
      
      if (totalRefundedSum >= order.total) {
        order.paymentStatus = 'REFUNDED';
        order.status = 'REFUNDED';
      } else {
        order.paymentStatus = 'REFUNDED'; // Partially refunded acts on status
        (order as any).paymentStatus = 'PARTIALLY_REFUNDED';
      }

      (order as any).metadata = {
        ...((order as any).metadata || {}),
        totalRefunded: totalRefundedSum,
        lastRefundId: refundId,
        lastRefundTimestamp: new Date(),
      };
      await order.save();

      // 10. Write final Audit Trail
      await AuditLog.create({
        user: operatorUserId ? new mongoose.Types.ObjectId(operatorUserId) : undefined,
        action: 'ORDER_WIDE_REFUND_COMPLETED',
        entityType: 'RefundTransaction',
        entityId: refundRecord._id.toString(),
        payload: {
          orderId,
          refundAmount,
          distribution,
          orderNumber: order.orderNumber,
        },
        reason: reason || 'Multi-source priority order refund.',
      });

      return {
        success: true,
        refundId,
        distribution,
      };
    });
  }

  /**
   * Lists all current Refund Transactions
   */
  async getAllRefunds() {
    return await RefundTransaction.find()
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber total status')
      .populate('paymentTransaction', 'transactionId gatewayPaymentId amount status');
  }
}
