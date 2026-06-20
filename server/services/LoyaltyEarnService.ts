import mongoose from 'mongoose';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { LoyaltyTierConfig } from '../models/LoyaltyTierConfig.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';
import { tierEvaluationService } from './TierEvaluationService.js';
import { exchangeRateService } from './ExchangeRateService.js';
import { lockService } from './LockService.js';
import { AuditLog } from '../models/AuditLog.js';

export interface IEarnPointsSnapshot {
  pointsEarned: number;
  tierMultiplierUsed: number;
  campaignApplied: string;
  currency: string;
  exchangeRateVersion?: number;
}

export class LoyaltyEarnService {
  /**
   * Section 2 — Calculate points eligible for an order amount
   */
  async calculatePointsForOrder(params: {
    userId: string;
    orderTotalInOrderCurrency: number;
    currency: string;
    campaignId?: string;
  }): Promise<{
    pointsToEarn: number;
    tierMultiplier: number;
    pointsInUSD: number;
    exchangeRateVersion: number;
  }> {
    const { userId, orderTotalInOrderCurrency, currency, campaignId } = params;

    // 1. Resolve rates
    const conversion = await exchangeRateService.convertAmount(orderTotalInOrderCurrency, currency, 'USD');
    const orderTotalInUSD = conversion.convertedAmount;

    // 2. Fetch or create a default LoyaltyAccount
    let account = await LoyaltyAccount.findOne({ userId });
    const { User } = await import('../models/User.js');
    if (!account) {
      const user = await User.findById(userId);
      const randomCode = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      account = await LoyaltyAccount.create({
        userId: new mongoose.Types.ObjectId(userId),
        pointsBalance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        referralCode: randomCode,
      });
    }

    // 3. Resolve Tier Config Multipliers
    await tierEvaluationService.ensureDefaultTierConfigs();
    const tierConfig = await LoyaltyTierConfig.findOne({ tier: account.currentTier });
    const tierMultiplier = tierConfig?.earningMultiplier || 1.0;

    // Basic rule: 10 Loyalty Points per 1 USD spent
    const basePointsPerUSD = 10;
    let computedPoints = orderTotalInUSD * basePointsPerUSD * tierMultiplier;

    // Round up points logically
    computedPoints = Math.round(computedPoints);

    return {
      pointsToEarn: computedPoints,
      tierMultiplier,
      pointsInUSD: orderTotalInUSD,
      exchangeRateVersion: conversion.exchangeVersion,
    };
  }

  /**
   * Section 2.5 — Executes points earning process and stamps snapshots to prevent historical recalculations
   */
  async earnPointsForOrder(params: {
    userId: string;
    orderId: string;
    orderTotalInOrderCurrency: number;
    currency: string;
    campaignId?: string;
  }): Promise<IEarnPointsSnapshot> {
    const { userId, orderId, orderTotalInOrderCurrency, currency, campaignId } = params;
    const lockKey = `lock:loyaltyearn:${userId}`;
    
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        return await lockService.withLock(lockKey, 15000, async () => {
      const calc = await this.calculatePointsForOrder({
        userId,
        orderTotalInOrderCurrency,
        currency,
        campaignId,
      });

      if (calc.pointsToEarn <= 0) {
        return {
          pointsEarned: 0,
          tierMultiplierUsed: calc.tierMultiplier,
          campaignApplied: campaignId || 'NONE',
          currency,
          exchangeRateVersion: calc.exchangeRateVersion,
        };
      }

      // Check for pre-existing idempotency/double earnings first
      const existingTx = await LoyaltyTransaction.findOne({
        orderId: new mongoose.Types.ObjectId(orderId),
        type: LoyaltyTxType.EARN,
      }).session(session);

      if (existingTx) {
        return {
          pointsEarned: existingTx.amount,
          tierMultiplierUsed: calc.tierMultiplier,
          campaignApplied: campaignId || 'NONE',
          currency,
          exchangeRateVersion: calc.exchangeRateVersion,
        };
      }

      // Resolve points value based on policy
      let activePolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 }).session(session);
      if (!activePolicy) {
        const policies = await LoyaltyValuationPolicy.create([{
          versionNumber: 1,
          pointValueInUSD: 0.01,
          currency: 'USD',
          effectiveFrom: new Date(),
        }], { session });
        activePolicy = policies[0];
      }

      // Load user account
      const account = await LoyaltyAccount.findOne({ userId }).session(session);
      if (!account) {
        throw new Error(`Unexpected block: LoyaltyAccount didn't initialize during calc.`);
      }

      // Ledger calculation - atomic addition with findOneAndUpdate to prevent race conditions
      const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
        { userId },
        {
          $inc: {
            pointsBalance: calc.pointsToEarn,
            lifetimeEarned: calc.pointsToEarn,
          },
        },
        { new: true, session }
      );
      if (!updatedAccount) throw new Error('Account update failed');

      // Write Transaction Ledger entry (Section 1.5)
      const tx = await LoyaltyTransaction.create([{
        loyaltyAccountId: updatedAccount._id,
        type: LoyaltyTxType.EARN,
        amount: calc.pointsToEarn,
        runningBalance: updatedAccount.pointsBalance,
        valuationVersion: activePolicy.versionNumber,
        pointsValueInCurrency: calc.pointsToEarn * activePolicy.pointValueInUSD,
        currency: 'USD',
        exchangeRateVersion: calc.exchangeRateVersion,
        orderId: new mongoose.Types.ObjectId(orderId),
        notes: `Earned points on checkout completion of order: ${orderId}`,
        policyVersion: '1.0',
      }], { session });

      // Audit logs
      await AuditLog.create([{
        action: 'LOYALTY_EARN_EVENT',
        entityType: 'LoyaltyTransaction',
        entityId: tx[0]._id.toString(),
        payload: {
          userId,
          orderId,
          pointsEarned: calc.pointsToEarn,
          newBalance: updatedAccount.pointsBalance,
        },
        reason: `Checkout completions award points.`,
      }], { session });

      // Evaluate tier upgrades / progression milestones automatically (Section 4.6)
      await tierEvaluationService.evaluateAndUpdateTier(account._id, undefined, session);

      return {
        pointsEarned: calc.pointsToEarn,
        tierMultiplierUsed: calc.tierMultiplier,
        campaignApplied: campaignId || 'NONE',
        currency,
        exchangeRateVersion: calc.exchangeRateVersion,
      };
    });
    });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Revokes/reclaims a portion of customer points earned from this order due to refund
   */
  async revokeEarnedPoints(params: {
    userId: string;
    orderId: string;
    pointsToRevoke: number;
    refundAmount: number;
  }): Promise<void> {
    const { userId, orderId, pointsToRevoke, refundAmount } = params;
    if (pointsToRevoke <= 0) return;

    const lockKey = `lock:loyaltyearn:${userId}`;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await lockService.withLock(lockKey, 15000, async () => {
          const account = await LoyaltyAccount.findOne({ userId }).session(session);
          if (!account) return;

          // Option A: Allow negative balances.
          // Refund Clawbacks logically subtract from the balance, even if a user goes into debt.
          const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
            { userId },
            {
              $inc: {
                pointsBalance: -pointsToRevoke,
                lifetimeEarned: -pointsToRevoke, // Subtract from lifetime earned or keep lifetime earned as total ever earned? Typically clawbacks reduce lifetime earned too, or they are tracked separately. Let's keep it simple and subtract.
              },
            },
            { new: true, session }
          );
          if (!updatedAccount) throw new Error('Failed to update account on revoke');

          let activePolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 }).session(session);
          const versionNum = activePolicy ? activePolicy.versionNumber : 1;
          const pointValue = activePolicy ? activePolicy.pointValueInUSD : 0.01;
          const usdValue = pointsToRevoke * pointValue;

          await LoyaltyTransaction.create([{
            loyaltyAccountId: updatedAccount._id,
            type: LoyaltyTxType.ADJUSTMENT, // or CLAWBACK/REVOKE if added to enum.
            amount: -pointsToRevoke, // Signed convention strictly applied
            runningBalance: updatedAccount.pointsBalance,
            valuationVersion: versionNum,
            pointsValueInCurrency: -usdValue, // SIGNED convention strictly applied here
            currency: 'USD',
            orderId: new mongoose.Types.ObjectId(orderId),
            notes: `Revoked ${pointsToRevoke} checkout points dynamically on order refund of amount ${refundAmount}.`,
          }], { session });

          await AuditLog.create([{
            action: 'LOYALTY_EARN_REVOKED',
            entityType: 'LoyaltyAccount',
            entityId: updatedAccount._id.toString(),
            payload: params,
            reason: 'Revocation due to partial/full order refund.',
          }], { session });

          await tierEvaluationService.evaluateAndUpdateTier(
            updatedAccount._id,
            `Points partial revocation of ${pointsToRevoke} due to refund.`,
            session
          );
        });
      });
    } finally {
      await session.endSession();
    }
  }
}

export const loyaltyEarnService = new LoyaltyEarnService();
