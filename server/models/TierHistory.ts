import mongoose, { Schema, Document } from 'mongoose';
import { LoyaltyTier } from './LoyaltyAccount.js';

export interface ITierHistory extends Document {
  loyaltyAccountId: mongoose.Types.ObjectId;
  previousTier: LoyaltyTier;
  newTier: LoyaltyTier;
  reason: string;
  timestamp: Date;
}

const TierHistorySchema: Schema = new Schema({
  loyaltyAccountId: { type: Schema.Types.ObjectId, ref: 'LoyaltyAccount', required: true, index: true },
  previousTier: { type: String, enum: Object.values(LoyaltyTier), required: true },
  newTier: { type: String, enum: Object.values(LoyaltyTier), required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, required: true },
});

export const TierHistory = mongoose.model<ITierHistory>('TierHistory', TierHistorySchema);
