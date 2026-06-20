import mongoose from 'mongoose';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';
import { exchangeRateService } from './ExchangeRateService.js';
import { lockService } from './LockService.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

export interface ILoyaltyRedemptionSnapshot {
  pointsRedeemed: number;
  valuationVersion: number;
  redeemedValueInOrderCurrency: number;
  currency: string;
  exchangeRateVersion?: number;
  orderId?: string;
}

export class LoyaltyRedemptionService {
  /**
   * Section 3 — Calculates cash discount value of redeemable points in the request order currency.
   */
  async calculatePointsValue(params: {
    userId: string;
    pointsToRedeem: number;
    orderCurrency: string;
  }): Promise<{
    valueInOrderCurrency: number;
    pointsRedeemable: number;
    valuationVersion: number;
    exchangeRateVersion: number;
    valueInUSD: number;
  }> {
    const { userId, pointsToRedeem, orderCurrency } = params;

    if (pointsToRedeem <= 0) {
      return { valueInOrderCurrency: 0, pointsRedeemable: 0, valuationVersion: 1, exchangeRateVersion: 1, valueInUSD: 0 };
    }

    const account = await LoyaltyAccount.findOne({ userId });
    if (!account) {
      return { valueInOrderCurrency: 0, pointsRedeemable: 0, valuationVersion: 1, exchangeRateVersion: 1, valueInUSD: 0 };
    }

    // Limit redemption to available points balance
    const pointsRedeemable = Math.min(account.pointsBalance, pointsToRedeem);

    // Resolve valuation policy
    let activePolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 });
    if (!activePolicy) {
      activePolicy = await LoyaltyValuationPolicy.create({
        versionNumber: 1,
        pointValueInUSD: 0.01,
        currency: 'USD',
        effectiveFrom: new Date(),
      });
    }

    // Cash value in USD
    const valueInUSD = pointsRedeemable * activePolicy.pointValueInUSD;

    // Convert cash value in USD to order's currency
    const conversion = await exchangeRateService.convertAmount(valueInUSD, 'USD', orderCurrency);
    const convertedValue = conversion.convertedAmount;

    return {
      valueInOrderCurrency: Number(convertedValue.toFixed(4)),
      pointsRedeemable,
      valuationVersion: activePolicy.versionNumber,
      exchangeRateVersion: conversion.exchangeVersion,
      valueInUSD: Number(valueInUSD.toFixed(4)),
    };
  }

  /**
   * Section 3.5 & 10.5 — Core debit ledger executions protected by concurrent locking and idempotency
   */
  async executeRedemptionLedger(params: {
    userId: string;
    orderId: string;
    pointsToRedeem: number;
    orderCurrency: string;
    idempotencyKey?: string;
  }): Promise<ILoyaltyRedemptionSnapshot> {
    const { userId, orderId, pointsToRedeem, orderCurrency, idempotencyKey } = params;

    const lockKey = `lock:loyaltyredeem:${userId}`;
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        return await lockService.withLock(lockKey, 20000, async () => {
      // 1. Audit idempotency
      if (idempotencyKey) {
        const preExistingTx = await LoyaltyTransaction.findOne({ idempotencyKey }).session(session);
        if (preExistingTx) {
          return {
            pointsRedeemed: Math.abs(preExistingTx.amount),
            valuationVersion: preExistingTx.valuationVersion,
            redeemedValueInOrderCurrency: Math.abs(preExistingTx.pointsValueInCurrency), // we'll read it back
            currency: 'USD', // internally reported in usd
            exchangeRateVersion: preExistingTx.exchangeRateVersion,
            orderId: preExistingTx.orderId?.toString(),
          };
        }
      }

      // Check if already redeemed points for this specific order
      const orderTx = await LoyaltyTransaction.findOne({
        orderId: new mongoose.Types.ObjectId(orderId),
        type: LoyaltyTxType.REDEEM,
      }).session(session);
      if (orderTx) {
        return {
          pointsRedeemed: Math.abs(orderTx.amount),
          valuationVersion: orderTx.valuationVersion,
          redeemedValueInOrderCurrency: Math.abs(orderTx.pointsValueInCurrency),
          currency: 'USD',
          exchangeRateVersion: orderTx.exchangeRateVersion,
          orderId: orderId,
        };
      }

      // 2. Load account with balance locks
      const account = await LoyaltyAccount.findOne({ userId }).session(session);
      if (!account) {
        throw new AppError(404, 'Loyalty Account not provisioned for user.');
      }

      const calc = await this.calculatePointsValue({
        userId,
        pointsToRedeem,
        orderCurrency,
      });

      if (calc.pointsRedeemable <= 0) {
        throw new AppError(400, 'User has zero redeemable loyalty points.');
      }

      if (account.pointsBalance < calc.pointsRedeemable) {
        throw new AppError(400, `Insufficient loyalty points. Requested: ${calc.pointsRedeemable}, Available: ${account.pointsBalance}`);
      }

      // 3. Atomically update balances (ledger derived cache)
      // We check pointsBalance condition within findOneAndUpdate to prevent race conditions natively
      const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
        { userId, pointsBalance: { $gte: calc.pointsRedeemable } },
        {
          $inc: {
            pointsBalance: -calc.pointsRedeemable,
            lifetimeRedeemed: calc.pointsRedeemable,
          },
        },
        { new: true, session }
      );
      if (!updatedAccount) {
         throw new AppError(400, 'Concurrent redemption logic aborted: insufficient balance.');
      }

      // Write transaction ledger (Section 1.5)
      const lpTx = await LoyaltyTransaction.create([{
        loyaltyAccountId: updatedAccount._id,
        type: LoyaltyTxType.REDEEM,
        amount: -calc.pointsRedeemable, // Negative on redemption
        runningBalance: updatedAccount.pointsBalance,
        valuationVersion: calc.valuationVersion,
        pointsValueInCurrency: -calc.valueInUSD, // Signed value snapshot
        currency: 'USD',
        exchangeRateVersion: calc.exchangeRateVersion,
        orderId: new mongoose.Types.ObjectId(orderId),
        notes: `Points redeemed on order creation ${orderId}`,
        idempotencyKey: idempotencyKey,
      }], { session });

      await AuditLog.create([{
        action: 'LOYALTY_REDEEM_EVENT',
        entityType: 'LoyaltyTransaction',
        entityId: lpTx[0]._id.toString(),
        payload: {
          userId,
          orderId,
          pointsRedeemed: calc.pointsRedeemable,
          valueInOrderCurrency: calc.valueInOrderCurrency,
          newPointsBalance: updatedAccount.pointsBalance,
        },
        reason: 'Debit loyalty ledger row completed.',
      }], { session });

      return {
        pointsRedeemed: calc.pointsRedeemable,
        valuationVersion: calc.valuationVersion,
        redeemedValueInOrderCurrency: calc.valueInOrderCurrency,
        currency: orderCurrency,
        exchangeRateVersion: calc.exchangeRateVersion,
        orderId,
      };
    });
    });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Re-credits points back to user's wallet on order cancellation / refund
   */
  async restoreRedeemedPoints(params: {
    userId: string;
    orderId: string;
    refundAmount: number;
    pointsToRestore: number;
  }): Promise<void> {
    const { userId, orderId, refundAmount, pointsToRestore } = params;
    if (pointsToRestore <= 0) return;

    const lockKey = `lock:loyaltyredeem:${userId}`;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await lockService.withLock(lockKey, 20000, async () => {
          const account = await LoyaltyAccount.findOne({ userId }).session(session);
          if (!account) return;

          const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
            { userId },
            {
              $inc: {
                pointsBalance: pointsToRestore,
                lifetimeRedeemed: -pointsToRestore,
              },
            },
            { new: true, session }
          );
          if (!updatedAccount) throw new AppError(500, 'Failed to update account on restore restored');

          // Find active policy
          let activePolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 }).session(session);
          const versionNum = activePolicy ? activePolicy.versionNumber : 1;
          const pointValue = activePolicy ? activePolicy.pointValueInUSD : 0.01;
          const usdValue = pointsToRestore * pointValue;

          await LoyaltyTransaction.create([{
            loyaltyAccountId: updatedAccount._id,
            type: LoyaltyTxType.ADJUSTMENT,
            amount: pointsToRestore,
            runningBalance: updatedAccount.pointsBalance,
            valuationVersion: versionNum,
            pointsValueInCurrency: usdValue,
            currency: 'USD',
            orderId: new mongoose.Types.ObjectId(orderId),
            notes: `Returned ${pointsToRestore} redeemed points dynamically on order refund of amount ${refundAmount}.`,
          }], { session });

          await AuditLog.create([{
            action: 'LOYALTY_RESTORE_REDEMPTION',
            entityType: 'LoyaltyAccount',
            entityId: updatedAccount._id.toString(),
            payload: params,
            reason: 'Restored points due to cancellation/refund.',
          }], { session });
        });
      });
    } finally {
      await session.endSession();
    }
  }
}

export const loyaltyRedemptionService = new LoyaltyRedemptionService();
export default loyaltyRedemptionService;
