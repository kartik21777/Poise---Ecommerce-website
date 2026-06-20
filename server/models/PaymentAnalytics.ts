import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAnalytics extends Document {
  timestamp: Date;
  metricType: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILURE' | 'REFUND_COMPLETED' | 'DISPUTE_OPENED' | 'DISPUTE_RESOLVED' | 'WEBHOOK_LATENCY';
  amount?: number;
  currency?: string;
  gateway?: 'RAZORPAY' | 'STRIPE' | 'COD';
  orderId?: mongoose.Types.ObjectId;
  transactionId?: string;
  latencyMs?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const paymentAnalyticsSchema = new Schema<IPaymentAnalytics>(
  {
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    metricType: {
      type: String,
      required: true,
      enum: ['PAYMENT_SUCCESS', 'PAYMENT_FAILURE', 'REFUND_COMPLETED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'WEBHOOK_LATENCY'],
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'COD'],
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
    },
    latencyMs: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

paymentAnalyticsSchema.index({ metricType: 1, timestamp: -1 });

export const PaymentAnalytics = mongoose.model<IPaymentAnalytics>('PaymentAnalytics', paymentAnalyticsSchema);
