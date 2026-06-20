import mongoose, { Document, Schema } from 'mongoose';

export type PaymentTransactionStatus =
  | 'CREATED'
  | 'PENDING'
  | 'AUTHORIZED'
  | 'CAPTURED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface IPaymentTransaction extends Document {
  transactionId: string; // Internal unique identifier (e.g., TXN-...)
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  gateway: 'RAZORPAY' | 'STRIPE' | 'COD';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  attemptNumber: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    transactionId: {
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
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'COD'],
      required: true,
      index: true,
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    gatewayPaymentId: {
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
      default: 'INR',
    },
    status: {
      type: String,
      enum: [
        'CREATED',
        'PENDING',
        'AUTHORIZED',
        'CAPTURED',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED',
      ],
      required: true,
      default: 'CREATED',
    },
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    failureReason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  paymentTransactionSchema
);
