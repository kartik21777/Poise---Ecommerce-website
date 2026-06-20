import mongoose, { Schema, Document } from 'mongoose';
import { LoyaltyTier } from './LoyaltyAccount.js';

export interface ILoyaltyTierConfig extends Document {
  tier: LoyaltyTier;
  qualificationThresholdPoints: number;
  retentionThresholdPoints: number;
  earningMultiplier: number;
  updatedAt: Date;
}

const LoyaltyTierConfigSchema: Schema = new Schema({
  tier: { type: String, enum: Object.values(LoyaltyTier), required: true, unique: true },
  qualificationThresholdPoints: { type: Number, required: true },
  retentionThresholdPoints: { type: Number, required: true },
  earningMultiplier: { type: Number, required: true },
}, { timestamps: true });

export const LoyaltyTierConfig = mongoose.model<ILoyaltyTierConfig>('LoyaltyTierConfig', LoyaltyTierConfigSchema);
