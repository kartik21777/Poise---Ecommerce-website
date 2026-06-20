import mongoose, { Document, Schema } from 'mongoose';

export type DisputeStatus = 'DISPUTE_OPENED' | 'EVIDENCE_REQUIRED' | 'UNDER_REVIEW' | 'WON' | 'LOST';

export interface IPaymentDispute extends Document {
  disputeId: string;
  paymentTransaction: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: DisputeStatus;
  reason?: string;
  evidenceDetails?: string;
  filedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentDisputeSchema = new Schema<IPaymentDispute>(
  {
    disputeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['DISPUTE_OPENED', 'EVIDENCE_REQUIRED', 'UNDER_REVIEW', 'WON', 'LOST'],
      required: true,
      default: 'DISPUTE_OPENED',
    },
    reason: {
      type: String,
    },
    evidenceDetails: {
      type: String,
    },
    filedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentDispute = mongoose.model<IPaymentDispute>(
  'PaymentDispute',
  paymentDisputeSchema
);
