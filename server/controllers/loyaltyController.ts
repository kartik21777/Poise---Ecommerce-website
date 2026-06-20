import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { LoyaltyAccount, LoyaltyTier } from '../models/LoyaltyAccount.js';
import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { TierHistory } from '../models/TierHistory.js';
import { ReferralProgram } from '../models/ReferralProgram.js';
import { LoyaltyTierConfig } from '../models/LoyaltyTierConfig.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';
import { ReferralRewardTransaction } from '../models/ReferralRewardTransaction.js';
import { loyaltyEarnService } from '../services/LoyaltyEarnService.js';
import { loyaltyRedemptionService } from '../services/LoyaltyRedemptionService.js';
import { loyaltyReferralService } from '../services/LoyaltyReferralService.js';
import { loyaltyLiabilityService } from '../services/LoyaltyLiabilityService.js';
import { tierEvaluationService } from '../services/TierEvaluationService.js';
import { AppError } from '../utils/AppError.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Section 8 & 8.6 — Customer Loyalty & Rewards Profile Dashboard
 */
export async function getLoyaltyDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      throw new AppError(401, 'Authentication required.');
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Get or lazy bootstrap LoyaltyAccount
    let account = await LoyaltyAccount.findOne({ userId: userIdObj });
    if (!account) {
      const { User } = await import('../models/User.js');
      const user = await User.findById(userIdObj);
      if (!user) {
        throw new AppError(404, 'User entity not found.');
      }
      const randomCode = loyaltyReferralService.generateReferralCode(user.email);
      account = await LoyaltyAccount.create({
        userId: userIdObj,
        pointsBalance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        referralCode: randomCode,
      });
    }

    // Ensure default tier configurations exist
    await tierEvaluationService.ensureDefaultTierConfigs();

    // Fetch transactions history (Loyalty ledger ledger)
    const transactions = await LoyaltyTransaction.find({ loyaltyAccountId: account._id })
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderNumber total');

    // Fetch tier change history log (Section 4.5 & 8.6)
    const tierChanges = await TierHistory.find({ loyaltyAccountId: account._id })
      .sort({ timestamp: -1 });

    // Fetch referral programs registered under this user (user referred others)
    const outboundReferrals = await ReferralProgram.find({ referrerUserId: userIdObj })
      .sort({ createdAt: -1 })
      .populate('referredUserId', 'name email');

    // Fetch user's incoming referral parent link if any
    const inboundReferral = await ReferralProgram.findOne({ referredUserId: userIdObj })
      .populate('referrerUserId', 'name');

    // Fetch active tier configs for progress tracking bar
    const tierConfigs = await LoyaltyTierConfig.find().sort({ qualificationThresholdPoints: 1 });

    res.json({
      success: true,
      data: {
        account,
        transactions,
        tierChanges,
        referrals: outboundReferrals,
        inboundReferral,
        tierConfigs,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Section 5 — Claims and claims a referral credit code link during signup or onboarding
 */
export async function claimReferralCode(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    const { code } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication required.');
    }
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'A valid referral link code is required.');
    }

    const referral = await loyaltyReferralService.registerReferral(code, userId);

    res.json({
      success: true,
      message: 'Referral connection established successfully.',
      data: referral,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Section 3 — Estimate active cash values of requested point redemptions
 */
export async function previewRedemptionValue(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    const { pointsToRedeem, orderCurrency } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication required.');
    }
    if (!pointsToRedeem || isNaN(pointsToRedeem)) {
      throw new AppError(400, 'Invalid points value specified.');
    }

    const calc = await loyaltyRedemptionService.calculatePointsValue({
      userId,
      pointsToRedeem: Number(pointsToRedeem),
      orderCurrency: orderCurrency || 'USD',
    });

    res.json({
      success: true,
      data: calc,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Add / Adjust Loyalty points directly
 */
export async function adminLoadLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, pointsAmount, notes } = req.body;
    const performedBy = (req as any).user?._id || 'ADMIN';

    if (!userId || !pointsAmount) {
      throw new AppError(400, 'userId and pointsAmount are required fields.');
    }

    const points = Number(pointsAmount);
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Locate Loyalty Account
    let account = await LoyaltyAccount.findOne({ userId: userIdObj });
    if (!account) {
      const { User } = await import('../models/User.js');
      const user = await User.findById(userIdObj);
      if (!user) {
        throw new AppError(404, 'User entity not found.');
      }
      const randomCode = loyaltyReferralService.generateReferralCode(user.email);
      account = await LoyaltyAccount.create({
        userId: userIdObj,
        pointsBalance: 0,
        lifetimeEarned: 0,
        lifetimeRedeemed: 0,
        referralCode: randomCode,
      });
    }

    // Force updates
    const previousBalance = account.pointsBalance;
    const newBalance = previousBalance + points;

    if (newBalance < 0) {
      throw new AppError(400, `Cannot subtract ${Math.abs(points)} points. Balance would fall below 0.`);
    }

    account.pointsBalance = newBalance;
    if (points > 0) {
      account.lifetimeEarned += points;
    } else {
      account.lifetimeRedeemed += Math.abs(points);
    }
    await account.save();

    // Create Valuation policy if missing
    let activeValuationPolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 });
    if (!activeValuationPolicy) {
      activeValuationPolicy = await LoyaltyValuationPolicy.create({
        versionNumber: 1,
        pointValueInUSD: 0.01,
        currency: 'USD',
        effectiveFrom: new Date(),
      });
    }

    // Logger Row In System
    const tx = await LoyaltyTransaction.create({
      loyaltyAccountId: account._id,
      type: LoyaltyTxType.ADJUSTMENT,
      amount: points,
      runningBalance: newBalance,
      valuationVersion: activeValuationPolicy.versionNumber,
      pointsValueInCurrency: Math.abs(points) * activeValuationPolicy.pointValueInUSD,
      currency: 'USD',
      notes: notes || `Manual administrative Adjustment by ${performedBy}`,
    });

    await AuditLog.create({
      action: 'LOYALTY_MANUAL_ADJUSTMENT',
      entityType: 'LoyaltyTransaction',
      entityId: tx._id.toString(),
      payload: { userId, points, previousBalance, newBalance },
      reason: notes || 'Manual Admin Adjustments',
    });

    // Run promotions/level audits
    await tierEvaluationService.evaluateAndUpdateTier(account._id, `Manual ledger adjustment of ${points} points.`);

    res.json({
      success: true,
      message: 'Loyalty balance updated and logged successfully in ledger.',
      data: account,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: List all Loyalty accounts in system
 */
export async function adminGetLoyaltyUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await LoyaltyAccount.find()
      .populate('userId', 'name email')
      .sort({ pointsBalance: -1 });

    res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Create / Update Loyalty Tier Configurations dynamically
 */
export async function adminUpdateLoyaltyTierConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const { tier, qualificationThresholdPoints, retentionThresholdPoints, earningMultiplier } = req.body;

    if (!tier || qualificationThresholdPoints === undefined || earningMultiplier === undefined) {
      throw new AppError(400, 'tier, qualificationThreshold, and multiplier are required parameters.');
    }

    const config = await LoyaltyTierConfig.findOneAndUpdate(
      { tier },
      {
        $set: {
          qualificationThresholdPoints: Number(qualificationThresholdPoints),
          retentionThresholdPoints: Number(retentionThresholdPoints || qualificationThresholdPoints * 0.8),
          earningMultiplier: Number(earningMultiplier),
        },
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      action: 'LOYALTY_CONFIG_UPDATED',
      entityType: 'LoyaltyTierConfig',
      entityId: config._id.toString(),
      payload: req.body,
      reason: 'Dynamic loyalty threshold or tier parameters updating.',
    });

    res.json({
      success: true,
      message: 'Tier configuration updated successfully.',
      data: config,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Fetch full Analytics and reports
 */
export async function adminGetLoyaltyAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await loyaltyLiabilityService.generateLiabilityReport();
    
    // Count of accounts by tiers
    const tierDistribution = await LoyaltyAccount.aggregate([
      {
        $group: {
          _id: '$currentTier',
          count: { $sum: 1 },
          totalPoints: { $sum: '$pointsBalance' },
        },
      },
    ]);

    // Active referrals analytics
    const pendingReferralsCount = await ReferralProgram.countDocuments({ status: 'PENDING' });
    const rewardedReferralsCount = await ReferralProgram.countDocuments({ status: 'REWARDED' });
    const flaggedReferralsCount = await ReferralProgram.countDocuments({ status: 'FLAGGED' });
    const revokedReferralsCount = await ReferralProgram.countDocuments({ status: 'REVOKED' });

    res.json({
      success: true,
      data: {
        liabilityReport: report,
        tierDistribution,
        referrals: {
          pending: pendingReferralsCount,
          rewarded: rewardedReferralsCount,
          flagged: flaggedReferralsCount,
          revoked: revokedReferralsCount,
          total: pendingReferralsCount + rewardedReferralsCount + flaggedReferralsCount + revokedReferralsCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Section 9.5 & 9.6 — Run automated reconciliation and anomaly detection
 */
export async function adminRunReconciliation(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await loyaltyLiabilityService.generateLiabilityReport();

    // 1. Scan for any accounts with negative points balances
    const negativeAccounts = await LoyaltyAccount.find({ pointsBalance: { $lt: 0 } }).populate('userId', 'name email');

    // 2. Scan ledger entries that reference an order but that order doesn't exist anymore (orphaned entries)
    const orphans: string[] = [];
    const transactionsWithOrders = await LoyaltyTransaction.find({ orderId: { $exists: true } });
    const { Order } = await import('../models/Order.js');
    
    for (const tx of transactionsWithOrders) {
      if (tx.orderId) {
        const ord = await Order.findById(tx.orderId);
        if (!ord) {
          orphans.push(`LoyaltyTransaction (${tx._id}) references non-existent Order: ${tx.orderId}`);
        }
      }
    }

    // 3. Scan for referral reward ledgers referencing non-existent referral codes
    const orphanedRewards: string[] = [];
    const rewardTxs = await ReferralRewardTransaction.find();
    for (const rw of rewardTxs) {
      const ref = await ReferralProgram.findById(rw.referralId);
      if (!ref) {
        orphanedRewards.push(`ReferralRewardTransaction (${rw._id}) references non-existent referral program mapping.`);
      }
    }

    // 4. Trace running balance errors. Recompute balance from sum of chronological entries and verify
    const accountDrifts: Array<{ accountId: string; userEmail: string; cachedBalance: number; actualSum: number; offset: number }> = [];
    const accounts = await LoyaltyAccount.find().populate('userId', 'email');
    
    for (const acc of accounts) {
      const txs = await LoyaltyTransaction.find({ loyaltyAccountId: acc._id });
      const sum = txs.reduce((tot, t) => tot + t.amount, 0);
      if (sum !== acc.pointsBalance) {
        accountDrifts.push({
          accountId: acc._id.toString(),
          userEmail: (acc.userId as any)?.email || 'UNKNOWN',
          cachedBalance: acc.pointsBalance,
          actualSum: sum,
          offset: acc.pointsBalance - sum,
        });
      }
    }

    const matchedSucceeded = report.reconciliationAuditMatched && negativeAccounts.length === 0 && orphans.length === 0 && accountDrifts.length === 0;

    res.json({
      success: true,
      data: {
        matchedSucceeded,
        liabilityReport: report,
        negativeAccountsFound: negativeAccounts.map(na => ({
          accountId: na._id,
          email: (na.userId as any)?.email,
          balance: na.pointsBalance,
        })),
        orphansFound: orphans,
        orphanedReferralRewards: orphanedRewards,
        trackedDrifts: accountDrifts,
        reconciledTimestamp: new Date(),
      },
    });
  } catch (err) {
    next(err);
  }
}
