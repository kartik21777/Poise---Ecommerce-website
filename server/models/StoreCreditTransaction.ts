import mongoose, { Document, Schema } from 'mongoose';

export type StoreCreditTransactionType = 'CREDIT_LOAD' | 'DEBIT_SPEND' | 'REFUND_CREDIT' | 'ADJUSTMENT' | 'EXPIRATION';

export interface IStoreCreditTransaction extends Document {
  account: mongoose.Types.ObjectId;
  type: StoreCreditTransactionType;
  amount: number; // Positive is load / refund credit, negative is debit / spend
  currency: string;
  transactionDate: Date;
  orderId?: mongoose.Types.ObjectId;
  refundId?: mongoose.Types.ObjectId;
  giftCardSource?: mongoose.Types.ObjectId;
  expirationDate?: Date;
  expirationReason?: string;
  isExpiring?: boolean;
  notes?: string;
  performedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const storeCreditTransactionSchema = new Schema<IStoreCreditTransaction>(
  {
    account: {
      type: Schema.Types.ObjectId,
      ref: 'StoreCreditAccount',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['CREDIT_LOAD', 'DEBIT_SPEND', 'REFUND_CREDIT', 'ADJUSTMENT', 'EXPIRATION'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    refundId: {
      type: Schema.Types.ObjectId,
      ref: 'RefundTransaction',
      index: true,
    },
    giftCardSource: {
      type: Schema.Types.ObjectId,
      ref: 'GiftCard',
      index: true,
    },
    expirationDate: {
      type: Date,
    },
    expirationReason: {
      type: String,
    },
    isExpiring: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
    },
    performedBy: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const StoreCreditTransaction = mongoose.model<IStoreCreditTransaction>('StoreCreditTransaction', storeCreditTransactionSchema);
