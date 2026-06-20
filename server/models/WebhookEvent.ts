import mongoose, { Document, Schema } from 'mongoose';

export type WebhookEventStatus = 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';

export interface IWebhookEvent extends Document {
  eventId: string; // Unique event ID from provider (Stripe/Razorpay)
  gateway: 'RAZORPAY' | 'STRIPE' | 'ERP' | 'CRM' | 'WAREHOUSE' | 'MARKETING';
  eventType: string;
  payloadHash?: string; // Optional checksum to verify duplicate contents
  status: WebhookEventStatus;
  processedAt?: Date;
  payload?: any; // Stored payload pack for recovery / re-running
  failureReason?: string; // Captured processing error
  retryCount?: number; // Reprocessing tracer
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gateway: {
      type: String,
      enum: ['RAZORPAY', 'STRIPE', 'ERP', 'CRM', 'WAREHOUSE', 'MARKETING'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payloadHash: {
      type: String,
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'PROCESSED', 'FAILED', 'IGNORED'],
      required: true,
      default: 'RECEIVED',
    },
    processedAt: {
      type: Date,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const WebhookEvent = mongoose.model<IWebhookEvent>(
  'WebhookEvent',
  webhookEventSchema
);
