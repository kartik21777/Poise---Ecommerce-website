import mongoose, { Document, Schema } from 'mongoose';

export interface ISegmentCondition {
  minLifetimeValue?: number;
  minOrderCount?: number;
  lastOrderWithinDays?: number;
  loyaltyTier?: string;
  vendorIdScope?: mongoose.Types.ObjectId;
}

export interface ICustomerSegment extends Document {
  name: string;
  description?: string;
  conditions: ISegmentCondition;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const customerSegmentSchema = new Schema<ICustomerSegment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    conditions: {
      minLifetimeValue: { type: Number, default: 0 },
      minOrderCount: { type: Number, default: 0 },
      lastOrderWithinDays: { type: Number },
      loyaltyTier: { type: String },
      vendorIdScope: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

export const CustomerSegment = mongoose.model<ICustomerSegment>('CustomerSegment', customerSegmentSchema);
