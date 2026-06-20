import mongoose from 'mongoose';
import { LoyaltyAccount, LoyaltyTier } from '../models/LoyaltyAccount.js';
import { LoyaltyTierConfig } from '../models/LoyaltyTierConfig.js';
import { TierHistory } from '../models/TierHistory.js';
import { AuditLog } from '../models/AuditLog.js';
import { lockService } from './LockService.js';

export class TierEvaluationService {
  /**
   * Initializes default tier configurations if none are present in database
   */
  async ensureDefaultTierConfigs(): Promise<void> {
    const count = await LoyaltyTierConfig.countDocuments();
    if (count === 0) {
      await LoyaltyTierConfig.create([
        {
          tier: LoyaltyTier.BRONZE,
          qualificationThresholdPoints: 0,
          retentionThresholdPoints: 0,
          earningMultiplier: 1.0,
        },
        {
          tier: LoyaltyTier.SILVER,
          qualificationThresholdPoints: 1000,
          retentionThresholdPoints: 800,
          earningMultiplier: 1.0, // default, or 1x as prompt requested
        },
        {
          tier: LoyaltyTier.GOLD,
          qualificationThresholdPoints: 5000,
          retentionThresholdPoints: 4000,
          earningMultiplier: 1.25, // Gold 1.25x
        },
        {
          tier: LoyaltyTier.PLATINUM,
          qualificationThresholdPoints: 10000,
          retentionThresholdPoints: 8000,
          earningMultiplier: 1.5, // Platinum 1.5x
        },
      ]);
    }
  }

  /**
   * Section 4.6 — Determines tier upgrade or retention eligibility.
   * Assesses total lifetime status points earned, then alters accounts and saves historic entries.
   */
  async evaluateAndUpdateTier(loyaltyAccountId: string | mongoose.Types.ObjectId, notes?: string, session?: mongoose.ClientSession): Promise<LoyaltyTier> {
    await this.ensureDefaultTierConfigs();
    const accountStr = loyaltyAccountId.toString();
    const lockKey = `lock:loyaltytier:${accountStr}`;

    return await lockService.withLock(lockKey, 15000, async () => {
      const account = await LoyaltyAccount.findById(loyaltyAccountId).session(session || null);
      if (!account) {
        throw new Error(`Loyalty account ${accountStr} not found.`);
      }

      // Read configurations dynamically instead of hardcoding
      const configs = await LoyaltyTierConfig.find().session(session || null).sort({ qualificationThresholdPoints: 1 });
      const pointsToCheck = account.lifetimeEarned; // Determine status tier eligibility using lifetime points earned

      let targetTier = LoyaltyTier.BRONZE;
      for (const config of configs) {
        if (pointsToCheck >= config.qualificationThresholdPoints) {
          targetTier = config.tier;
        }
      }

      if (account.currentTier !== targetTier) {
        const oldTier = account.currentTier;
        
        // Use findOneAndUpdate instead of account.save() to be fully atomic 
        await LoyaltyAccount.findOneAndUpdate(
          { _id: account._id },
          { $set: { currentTier: targetTier } },
          { session }
        );

        // Register Audit Trail (Section 4.5 & 8.6)
        const opts = session ? { session } : {};
        await TierHistory.create([{
          loyaltyAccountId: account._id,
          previousTier: oldTier,
          newTier: targetTier,
          reason: notes || `Auto-evaluation milestone achieved with ${pointsToCheck} total points earned.`,
        }], opts);

        await AuditLog.create([{
          action: 'LOYALTY_TIER_CHANGED',
          entityType: 'LoyaltyAccount',
          entityId: account._id.toString(),
          payload: { oldTier, newTier: targetTier, lifetimeEarned: pointsToCheck },
          reason: `Automatic tier evaluation updated from ${oldTier} to ${targetTier}`,
        }], opts);
        
        return targetTier;
      }

      return account.currentTier;
    });
  }
}

export const tierEvaluationService = new TierEvaluationService();
