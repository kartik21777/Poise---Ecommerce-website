import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotionCondition {
  minCartValue?: number;
  requiredProductIds?: mongoose.Types.ObjectId[];
  requiredCategoryIds?: mongoose.Types.ObjectId[];
  buyQuantity?: number;
  getYQuantity?: number;
  requiredLoyaltyTier?: string;
}

export interface IPromotionReward {
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue: number;
  targetProductIds?: mongoose.Types.ObjectId[];
  targetCategoryIds?: mongoose.Types.ObjectId[];
  pointsMultiplier?: number;
}

export interface IPromotion extends Document {
  name: string;
  description?: string;
  type: 'BUY_X_GET_Y' | 'CATEGORY_DISCOUNT' | 'PRODUCT_DISCOUNT' | 'CART_DISCOUNT' | 'LOYALTY_MULTIPLIER';
  conditions: IPromotionCondition;
  rewards: IPromotionReward;
  priority: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'DISABLED';
  startDate?: Date;
  endDate?: Date;
  vendorScope: 'GLOBAL' | 'VENDOR';
  vendorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['BUY_X_GET_Y', 'CATEGORY_DISCOUNT', 'PRODUCT_DISCOUNT', 'CART_DISCOUNT', 'LOYALTY_MULTIPLIER'],
      required: true,
    },
    conditions: {
      minCartValue: { type: Number, default: 0 },
      requiredProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      requiredCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      buyQuantity: { type: Number },
      getYQuantity: { type: Number },
      requiredLoyaltyTier: { type: String },
    },
    rewards: {
      discountType: { type: String, enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], required: true },
      discountValue: { type: Number, required: true, default: 0 },
      targetProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      targetCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      pointsMultiplier: { type: Number, default: 1 },
    },
    priority: { type: Number, default: 0, index: true },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'DISABLED'], default: 'DRAFT', index: true },
    startDate: { type: Date },
    endDate: { type: Date },
    vendorScope: { type: String, enum: ['GLOBAL', 'VENDOR'], default: 'GLOBAL', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
  },
  { timestamps: true }
);

promotionSchema.index({ status: 1, startDate: 1, endDate: 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
