import mongoose, { Document, Schema } from 'mongoose';

export interface IRecentlyViewedItem {
  product: mongoose.Types.ObjectId;
  viewedAt: Date;
}

export interface IRecentlyViewed extends Document {
  user: mongoose.Types.ObjectId;
  items: IRecentlyViewedItem[];
  createdAt: Date;
  updatedAt: Date;
}

const recentlyViewedItemSchema = new Schema<IRecentlyViewedItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  viewedAt: { type: Date, default: Date.now },
});

const recentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [recentlyViewedItemSchema],
  },
  {
    timestamps: true,
  }
);

export const RecentlyViewed = mongoose.model<IRecentlyViewed>('RecentlyViewed', recentlyViewedSchema);
