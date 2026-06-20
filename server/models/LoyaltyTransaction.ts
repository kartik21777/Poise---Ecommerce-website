import mongoose, { Schema, Document } from 'mongoose';

export enum LoyaltyTxType {
  EARN = 'earn',
  REDEEM = 'redeem',
  ADJUSTMENT = 'adjustment',
  EXPIRATION = 'expiration',
  REFERRAL_REWARD = 'referral_reward',
  PROMOTION_REWARD = 'promotion_reward',
}

export interface ILoyaltyTransaction extends Document {
  loyaltyAccountId: mongoose.Types.ObjectId;
  type: LoyaltyTxType;
  amount: number; // Positive for earn/rewards, negative for redeem/expiration/adjustment
  runningBalance: number;
  valuationVersion: number;
  pointsValueInCurrency: number; // Value of points in currency at transaction time
  currency: string;
  exchangeRateVersion?: number;
  orderId?: mongoose.Types.ObjectId;
  notes?: string;
  idempotencyKey?: string;
  isPromotional: boolean;
  issuedDate: Date;
  expirationDate?: Date;
  expirationReason?: string;
  policyVersion?: string;
  createdAt: Date;
}

const LoyaltyTransactionSchema: Schema = new Schema(
  {
    loyaltyAccountId: { type: Schema.Types.ObjectId, ref: 'LoyaltyAccount', required: true, index: true },
    type: { type: String, enum: Object.values(LoyaltyTxType), required: true, index: true },
    amount: { type: Number, required: true },
    runningBalance: { type: Number, required: true },
    valuationVersion: { type: Number, required: true, default: 1 },
    pointsValueInCurrency: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD' },
    exchangeRateVersion: { type: Number },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    notes: { type: String },
    idempotencyKey: { type: String, unique: true, sparse: true },
    isPromotional: { type: Boolean, default: false, index: true },
    issuedDate: { type: Date, default: Date.now },
    expirationDate: { type: Date, index: true },
    expirationReason: { type: String },
    policyVersion: { type: String, default: '1.0' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

LoyaltyTransactionSchema.index({ createdAt: 1 });

export const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction>('LoyaltyTransaction', LoyaltyTransactionSchema);
