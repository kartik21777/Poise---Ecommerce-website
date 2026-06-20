import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailCampaign extends Document {
  name: string;
  type: 'PROMOTIONAL' | 'LOYALTY' | 'VENDOR' | 'ABANDONED_CART' | 'PRODUCT_LAUNCH';
  subject: string;
  bodyTemplate: string;
  targetSegmentId?: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  status: 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED';
  scheduledAt?: Date;
  sentAt?: Date;
  metrics: {
    sentCount: number;
    openCount: number;
    clickCount: number;
    conversionCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const emailCampaignSchema = new Schema<IEmailCampaign>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['PROMOTIONAL', 'LOYALTY', 'VENDOR', 'ABANDONED_CART', 'PRODUCT_LAUNCH'],
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    bodyTemplate: { type: String, required: true },
    targetSegmentId: { type: Schema.Types.ObjectId, ref: 'CustomerSegment', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    status: { type: String, enum: ['SCHEDULED', 'SENDING', 'SENT', 'CANCELLED'], default: 'SCHEDULED', index: true },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    metrics: {
      sentCount: { type: Number, default: 0 },
      openCount: { type: Number, default: 0 },
      clickCount: { type: Number, default: 0 },
      conversionCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const EmailCampaign = mongoose.model<IEmailCampaign>('EmailCampaign', emailCampaignSchema);
