import mongoose, { Document, Schema } from 'mongoose';

export interface IProductReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  rating: number; // 1-5
  title: string;
  reviewBody: string;
  isVerifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const productReviewSchema = new Schema<IProductReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reviewBody: {
      type: String,
      required: true,
      trim: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
      index: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user-product pair
productReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const ProductReview = mongoose.model<IProductReview>('ProductReview', productReviewSchema);
