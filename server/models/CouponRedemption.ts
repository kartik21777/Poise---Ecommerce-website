import mongoose, { Document, Schema } from 'mongoose';

export interface ICouponRedemption extends Document {
  couponId: mongoose.Types.ObjectId;
  couponCode: string;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  discountAmount: number;
  redeemedAt: Date;
  vendorScope: 'GLOBAL' | 'VENDOR';
  vendorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponRedemptionSchema = new Schema<ICouponRedemption>(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    couponCode: { type: String, required: true, uppercase: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    discountAmount: { type: Number, required: true, min: 0 },
    redeemedAt: { type: Date, default: Date.now, required: true },
    vendorScope: { type: String, enum: ['GLOBAL', 'VENDOR'], default: 'GLOBAL', required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  },
  { timestamps: true }
);

couponRedemptionSchema.index({ userId: 1, couponId: 1, orderId: 1 }, { unique: true });

export const CouponRedemption = mongoose.model<ICouponRedemption>('CouponRedemption', couponRedemptionSchema);
