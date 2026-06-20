import mongoose, { Document, Schema } from 'mongoose';

export interface IAttributionEvent extends Document {
  visitorId: string;
  userId?: mongoose.Types.ObjectId;
  source: string;
  medium?: string;
  campaign?: string;
  referral?: string;
  landingPage?: string;
  orderId?: mongoose.Types.ObjectId;
  vendorIdScope?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attributionEventSchema = new Schema<IAttributionEvent>(
  {
    visitorId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    source: { type: String, required: true, index: true },
    medium: { type: String },
    campaign: { type: String, index: true },
    referral: { type: String },
    landingPage: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },
    vendorIdScope: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  },
  { timestamps: true }
);

attributionEventSchema.index({ visitorId: 1, source: 1, campaign: 1, createdAt: -1 });

export const AttributionEvent = mongoose.model<IAttributionEvent>('AttributionEvent', attributionEventSchema);
