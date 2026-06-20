import mongoose, { Document, Schema } from 'mongoose';

export interface IRegionalPrice extends Document {
  product: mongoose.Types.ObjectId;
  variantSku?: string; // If override is SKU-specific, otherwise empty is general
  countryCode?: string; // Optional limits: ISO 2-letters, e.g. 'IN', 'FR'
  currencyCode: string; // ISO 3-letters, e.g. 'INR', 'EUR'
  price: number;
  compareAtPrice?: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const regionalPriceSchema = new Schema<IRegionalPrice>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variantSku: { type: String, trim: true, index: true },
    countryCode: { type: String, uppercase: true, trim: true, index: true },
    currencyCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    isEnabled: { type: Boolean, required: true, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes to avoid runtime lookups bottlenecks 
regionalPriceSchema.index({ product: 1, countryCode: 1, currencyCode: 1 });
regionalPriceSchema.index({ product: 1, variantSku: 1, countryCode: 1, currencyCode: 1 });

export const RegionalPrice = mongoose.model<IRegionalPrice>('RegionalPrice', regionalPriceSchema);
