import mongoose, { Schema, Document } from 'mongoose';

export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface ILoyaltyAccount extends Document {
  userId: mongoose.Types.ObjectId;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  currentTier: LoyaltyTier;
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyAccountSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pointsBalance: { type: Number, required: true, default: 0 },
    lifetimeEarned: { type: Number, required: true, default: 0 },
    lifetimeRedeemed: { type: Number, required: true, default: 0 },
    currentTier: { type: String, enum: Object.values(LoyaltyTier), default: LoyaltyTier.BRONZE },
    referralCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export const LoyaltyAccount = mongoose.model<ILoyaltyAccount>('LoyaltyAccount', LoyaltyAccountSchema);
