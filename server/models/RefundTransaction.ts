import mongoose, { Document, Schema } from 'mongoose';

export type RefundTransactionStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IRefundTransaction extends Document {
  refundId: string; // Unique internal refund ID
  order: mongoose.Types.ObjectId;
  paymentTransaction: mongoose.Types.ObjectId;
  gatewayRefundId?: string;
  amount: number;
  currency: string;
  exchangeRateUsed: number;
  exchangeRateVersion?: mongoose.Types.ObjectId;
  reason?: string;
  status: RefundTransactionStatus;
  gatewayRefundAmount?: number;
  storeCreditRefundAmount?: number;
  giftCardRefundAllocations?: {
    giftCardId: mongoose.Types.ObjectId;
    code: string;
    amount: number; // in order currency
  }[];
  loyaltyPointsRefundAmount?: number;
  loyaltyAmountRefundAmount?: number;
  pointsEarnedRevoked?: number;
  createdAt: Date;
  updatedAt: Date;
}

const refundTransactionSchema = new Schema<IRefundTransaction>(
  {
    refundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentTransaction: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      required: true,
      index: true,
    },
    gatewayRefundId: {
      type: String,
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
      default: 'USD',
    },
    exchangeRateUsed: {
      type: Number,
      required: true,
      default: 1.0,
    },
    exchangeRateVersion: {
      type: Schema.Types.ObjectId,
      ref: 'ExchangeRateVersion',
    },
    reason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED'],
      required: true,
      default: 'REQUESTED',
    },
    gatewayRefundAmount: {
      type: Number,
      default: 0,
    },
    storeCreditRefundAmount: {
      type: Number,
      default: 0,
    },
    giftCardRefundAllocations: [
      {
        giftCardId: { type: Schema.Types.ObjectId, ref: 'GiftCard' },
        code: { type: String },
        amount: { type: Number },
      }
    ],
    loyaltyPointsRefundAmount: {
      type: Number,
      default: 0,
    },
    loyaltyAmountRefundAmount: {
      type: Number,
      default: 0,
    },
    pointsEarnedRevoked: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const RefundTransaction = mongoose.model<IRefundTransaction>(
  'RefundTransaction',
  refundTransactionSchema
);
