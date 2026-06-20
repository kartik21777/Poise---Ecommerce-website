import mongoose, { Schema, Document } from 'mongoose';

export enum ReferralRewardTxType {
  LOYALTY_BONUS = 'loyalty_bonus',
  REDEMPTION = 'redemption',
  REVOCATION = 'revocation',
  FRAUD_ADJUSTMENT = 'fraud_adjustment',
}

export interface IReferralRewardTransaction extends Document {
  referralId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ReferralRewardTxType;
  amount: number; // point rewards
  currency: string;
  refTransactionId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const ReferralRewardTransactionSchema: Schema = new Schema(
  {
    referralId: { type: Schema.Types.ObjectId, ref: 'ReferralProgram', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(ReferralRewardTxType), required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'USD' },
    refTransactionId: { type: Schema.Types.ObjectId },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ReferralRewardTransaction = mongoose.model<IReferralRewardTransaction>(
  'ReferralRewardTransaction',
  ReferralRewardTransactionSchema
);
