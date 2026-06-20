import mongoose from 'mongoose';
import { ReferralProgram, IReferralProgram } from '../models/ReferralProgram.js';
import { ReferralRewardTransaction, ReferralRewardTxType } from '../models/ReferralRewardTransaction.js';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';
import { exchangeRateService } from './ExchangeRateService.js';
import { lockService } from './LockService.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

export class LoyaltyReferralService {
  /**
   * Helper to generate a unique referral link code
   */
  generateReferralCode(email: string): string {
    const handle = email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
    const rand = Math.floor(100+ Math.random() * 900);
    return `REF-${handle}-${rand}`;
  }

  /**
   * Section 5.5 — Advanced fraud detection looking for dupe accounts or clusters
   */
  async detectReferralFraud(referrerId: string, referredId: string): Promise<{ isSuspicious: boolean; flags: string[] }> {
    const flags: string[] = [];
    const { User } = await import('../models/User.js');

    const referrer = await User.findById(referrerId);
    const referred = await User.findById(referredId);

    if (!referrer || !referred) {
      return { isSuspicious: true, flags: ['INVALID_ACCOUNTS'] };
    }

    // 1. Prevent self referrals
    if (referrerId === referredId || referrer.email === referred.email) {
      flags.push('SELF_REFERRAL_BY_EMAIL_OR_ID');
    }

    // 2. Strict text similarity checks on user profiles
    const refPrefix = referrer.email.split('@')[0];
    const recPrefix = referred.email.split('@')[0];
    if (refPrefix.startsWith(recPrefix) || recPrefix.startsWith(refPrefix) || refPrefix.slice(0,4) === recPrefix.slice(0,4)) {
      flags.push('SIMILAR_EMAIL_PATTERN');
    }

    // 3. Name similarity check
    const cleanRefName = referrer.name.trim().toLowerCase();
    const cleanRecName = referred.name.trim().toLowerCase();
    if (cleanRefName === cleanRecName && cleanRefName.length > 0) {
      flags.push('IDENTICAL_NAME_MATCH');
    }

    return {
      isSuspicious: flags.length > 0,
      flags,
    };
  }

  /**
   * Section 5 — Register a pending referral code link during signup
   */
  async registerReferral(referrerCode: string, referredUserId: string): Promise<IReferralProgram> {
    const lockKey = `lock:referral_reg:${referredUserId}`;
    return await lockService.withLock(lockKey, 15000, async () => {
      // Find referrer
      const referralCodeNormalized = referrerCode.trim().toUpperCase();
      const referrerAccount = await LoyaltyAccount.findOne({ referralCode: referralCodeNormalized });
      if (!referrerAccount) {
        throw new AppError(404, `Referral code "${referralCodeNormalized}" is invalid.`);
      }

      const referrerUserId = referrerAccount.userId.toString();

      // Check self referral
      if (referrerUserId === referredUserId) {
        throw new AppError(400, 'Self-referrals are strictly blocked.');
      }

      // Check if already referred
      const existing = await ReferralProgram.findOne({ referredUserId: new mongoose.Types.ObjectId(referredUserId) });
      if (existing) {
        throw new AppError(400, 'Referred user is already mapped to a referral link.');
      }

      // Perform proactive fraud audit
      const fraudCheck = await this.detectReferralFraud(referrerUserId, referredUserId);

      const referral = await ReferralProgram.create({
        referrerUserId: new mongoose.Types.ObjectId(referrerUserId),
        referredUserId: new mongoose.Types.ObjectId(referredUserId),
        referralCode: referralCodeNormalized,
        status: fraudCheck.isSuspicious ? 'FLAGGED' : 'PENDING',
        notes: fraudCheck.isSuspicious ? `Fraud Flagged: [${fraudCheck.flags.join(', ')}]` : undefined,
      });

      await AuditLog.create({
        action: 'REFERRAL_REGISTERED',
        entityType: 'ReferralProgram',
        entityId: referral._id.toString(),
        payload: { referrerUserId, referredUserId, status: referral.status },
        reason: 'Referral coupon claimed during user enrollment.',
      });

      return referral;
    });
  }

  /**
   * Section 5 & 5.6 — Issue points reward following qualifying first purchase
   */
  async rewardOnPurchase(orderId: string, referredUserId: string): Promise<boolean> {
    const lockKey = `lock:referral_reward:${referredUserId}`;
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        return await lockService.withLock(lockKey, 15000, async () => {
          const referral = await ReferralProgram.findOne({
            referredUserId: new mongoose.Types.ObjectId(referredUserId),
            status: { $in: ['PENDING', 'FLAGGED'] },
          }).session(session);

          if (!referral) return false;

          const referrerId = referral.referrerUserId.toString();

          // Ensure referrer has a loyalty account
          let referrerLoyaltyAccount = await LoyaltyAccount.findOne({ userId: referrerId }).session(session);
          // Lazy init accounts
          if (!referrerLoyaltyAccount) {
            const { User } = await import('../models/User.js');
            const user = await User.findById(referrerId).session(session);
            const randomCode = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
            const res = await LoyaltyAccount.create([{
              userId: new mongoose.Types.ObjectId(referrerId),
              pointsBalance: 0,
              lifetimeEarned: 0,
              lifetimeRedeemed: 0,
              referralCode: randomCode,
            }], { session });
            referrerLoyaltyAccount = res[0];
          }

          // Fixed reward campaign guidelines:
          // - Referrer earns 500 Loyalty points
          // - Referred user earns 200 Loyalty points
          const referrerPoints = 500;
          const referredPoints = 200;

          const updatedReferrerLoyaltyAccount = await LoyaltyAccount.findOneAndUpdate(
            { _id: referrerLoyaltyAccount._id },
            { $inc: { pointsBalance: referrerPoints, lifetimeEarned: referrerPoints } },
            { new: true, session }
          );

          // Resolve current points rate
          let activeValuationPolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 }).session(session);
          if (!activeValuationPolicy) {
            const vp = await LoyaltyValuationPolicy.create([{
              versionNumber: 1,
              pointValueInUSD: 0.01,
              currency: 'USD',
              effectiveFrom: new Date(),
            }], { session });
            activeValuationPolicy = vp[0];
          }

          const rates = await exchangeRateService.getLatestRates();

          // Write Referrer's Loyalty Transaction Ledger (Section 1.5)
          const refTx = await LoyaltyTransaction.create([{
            loyaltyAccountId: updatedReferrerLoyaltyAccount!._id,
            type: LoyaltyTxType.REFERRAL_REWARD,
            amount: referrerPoints,
            runningBalance: updatedReferrerLoyaltyAccount!.pointsBalance,
            valuationVersion: activeValuationPolicy.versionNumber,
            pointsValueInCurrency: referrerPoints * activeValuationPolicy.pointValueInUSD, // Signed Absolute Option A
            currency: 'USD',
            exchangeRateVersion: rates.versionNumber,
            orderId: new mongoose.Types.ObjectId(orderId),
            notes: `Referral award issued for referring user ${referredUserId}`,
          }], { session });

          // Add points to referred user's Loyalty Account
          let referredLoyaltyAccount = await LoyaltyAccount.findOne({ userId: referredUserId }).session(session);
          if (!referredLoyaltyAccount) {
            const randomCode = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
            const res = await LoyaltyAccount.create([{
              userId: new mongoose.Types.ObjectId(referredUserId),
              pointsBalance: 0,
              lifetimeEarned: 0,
              lifetimeRedeemed: 0,
              referralCode: randomCode,
            }], { session });
            referredLoyaltyAccount = res[0];
          }

          const updatedReferredLoyaltyAccount = await LoyaltyAccount.findOneAndUpdate(
            { _id: referredLoyaltyAccount._id },
            { $inc: { pointsBalance: referredPoints, lifetimeEarned: referredPoints } },
            { new: true, session }
          );

          // Write Referred User's Loyalty Transaction Ledger
          const recTx = await LoyaltyTransaction.create([{
            loyaltyAccountId: updatedReferredLoyaltyAccount!._id,
            type: LoyaltyTxType.REFERRAL_REWARD,
            amount: referredPoints,
            runningBalance: updatedReferredLoyaltyAccount!.pointsBalance,
            valuationVersion: activeValuationPolicy.versionNumber,
            pointsValueInCurrency: referredPoints * activeValuationPolicy.pointValueInUSD,
            currency: 'USD',
            exchangeRateVersion: rates.versionNumber,
            orderId: new mongoose.Types.ObjectId(orderId),
            notes: `Referral welcome bonus for completing your first purchase`,
          }], { session });

          // Write Referral Reward Transaction Ledger (Section 5.6)
          await ReferralRewardTransaction.create([{
            referralId: referral._id,
            userId: new mongoose.Types.ObjectId(referrerId),
            type: ReferralRewardTxType.LOYALTY_BONUS,
            amount: referrerPoints,
            currency: 'USD',
            refTransactionId: refTx[0]._id,
            notes: `Bonus points added to referrer. Status context was: ${referral.status}`,
          }], { session });

          // Write Referral welcome reward ledger transaction
          await ReferralRewardTransaction.create([{
            referralId: referral._id,
            userId: new mongoose.Types.ObjectId(referredUserId),
            type: ReferralRewardTxType.LOYALTY_BONUS,
            amount: referredPoints,
            currency: 'USD',
            refTransactionId: recTx[0]._id,
            notes: 'Bonus points added to referee upon successful first purchase.',
          }], { session });

          // Mark Referral Program mapping completed
          await ReferralProgram.findOneAndUpdate(
            { _id: referral._id },
            { $set: { status: 'REWARDED' } },
            { session }
          );

          await AuditLog.create([{
            action: 'REFERRAL_REWARDS_DISBURSED',
            entityType: 'ReferralProgram',
            entityId: referral._id.toString(),
            payload: {
              referrerId,
              referredUserId,
              referrerPointsAwarded: referrerPoints,
              referredPointsAwarded: referredPoints,
            },
            reason: `Qualified checkout on order ${orderId} triggers reward ledger.`,
          }], { session });

          return true;
        });
      });
    } finally {
      await session.endSession();
    }
  }

  /**
   * Reverses referral rewards if the triggering order is cancelled/refunded.
   */
  async revokeReferralOnRefund(orderId: string): Promise<boolean> {
    const session = await mongoose.startSession();
    try {
      return await session.withTransaction(async () => {
        const txs = await LoyaltyTransaction.find({
          orderId: new mongoose.Types.ObjectId(orderId),
          type: LoyaltyTxType.REFERRAL_REWARD,
        }).session(session);

        if (txs.length === 0) return false;

        for (const tx of txs) {
          const account = await LoyaltyAccount.findById(tx.loyaltyAccountId).session(session);
          if (account) {
            // Remediation 5: Allow negative balances unconditionally to properly account for order refunds
            const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
              { _id: account._id },
              { $inc: { pointsBalance: -tx.amount, lifetimeEarned: -tx.amount } },
              { new: true, session }
            );

            // Write ledger adjustment record matching Option A (Signed Values everywhere)
            await LoyaltyTransaction.create([{
              loyaltyAccountId: account._id,
              type: LoyaltyTxType.ADJUSTMENT,
              amount: -tx.amount, // strict signed
              runningBalance: updatedAccount!.pointsBalance,
              valuationVersion: tx.valuationVersion,
              pointsValueInCurrency: -(tx.pointsValueInCurrency), // Signed
              currency: tx.currency,
              exchangeRateVersion: tx.exchangeRateVersion,
              orderId: new mongoose.Types.ObjectId(orderId),
              notes: `Referral award revocation following order cancellation or refund.`,
            }], { session });
          }
        }

        const matchedReferrals = await ReferralRewardTransaction.find({
          refTransactionId: { $in: txs.map(t => t._id) }
        }).session(session);

        if (matchedReferrals.length > 0) {
          const referralIds = matchedReferrals.map(mr => mr.referralId);
          await ReferralProgram.updateMany(
            { _id: { $in: referralIds } },
            { $set: { status: 'PENDING', notes: 'Rewards revoked due to triggering order refund.' } },
            { session }
          );
        }

        return true;
      });
    } finally {
      await session.endSession();
    }
  }
}

export const loyaltyReferralService = new LoyaltyReferralService();

