import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  minimumOrderValue?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  usagePerUser?: number;
  validFrom?: Date;
  validUntil?: Date;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  vendorScope: 'GLOBAL' | 'VENDOR';
  vendorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minimumOrderValue: { type: Number, default: 0 },
    maximumDiscount: { type: Number },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
    usagePerUser: { type: Number, default: 1 },
    validFrom: { type: Date },
    validUntil: { type: Date },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'DISABLED'], default: 'DRAFT', index: true },
    vendorScope: { type: String, enum: ['GLOBAL', 'VENDOR'], default: 'GLOBAL', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  },
  { timestamps: true }
);

couponSchema.index({ status: 1, validFrom: 1, validUntil: 1 });

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema);
