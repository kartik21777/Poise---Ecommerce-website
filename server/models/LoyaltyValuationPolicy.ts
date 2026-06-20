import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyValuationPolicy extends Document {
  versionNumber: number;
  pointValueInUSD: number; // e.g., 1 point = 0.01 USD
  currency: string;
  effectiveFrom: Date;
  notes?: string;
}

const LoyaltyValuationPolicySchema: Schema = new Schema({
  versionNumber: { type: Number, required: true, unique: true },
  pointValueInUSD: { type: Number, required: true, default: 0.01 },
  currency: { type: String, required: true, default: 'USD' },
  effectiveFrom: { type: Date, required: true, default: Date.now },
  notes: { type: String },
});

export const LoyaltyValuationPolicy = mongoose.model<ILoyaltyValuationPolicy>('LoyaltyValuationPolicy', LoyaltyValuationPolicySchema);
