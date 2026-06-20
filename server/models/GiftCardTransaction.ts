import mongoose, { Document, Schema } from 'mongoose';

export type GiftCardTransactionType = 'ISSUANCE' | 'REDEMPTION' | 'REFUND' | 'ADJUSTMENT' | 'EXPIRATION';

export interface IGiftCardTransaction extends Document {
  giftCard: mongoose.Types.ObjectId;
  type: GiftCardTransactionType;
  amount: number; // Positive is addition / refund, negative is spend / reduction
  currency: string;
  transactionDate: Date;
  orderId?: mongoose.Types.ObjectId;
  refundId?: mongoose.Types.ObjectId;
  referenceId?: string;
  note?: string;
  performedBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardTransactionSchema = new Schema<IGiftCardTransaction>(
  {
    giftCard: {
      type: Schema.Types.ObjectId,
      ref: 'GiftCard',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ISSUANCE', 'REDEMPTION', 'REFUND', 'ADJUSTMENT', 'EXPIRATION'],
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
    referenceId: {
      type: String,
      index: true,
    },
    note: {
      type: String,
    },
    performedBy: {
      type: Schema.Types.Mixed,
    }
  },
  {
    timestamps: true,
  }
);

export const GiftCardTransaction = mongoose.model<IGiftCardTransaction>('GiftCardTransaction', giftCardTransactionSchema);
