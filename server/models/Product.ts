import mongoose, { Document, Schema } from 'mongoose';

export interface IProductImage {
  public_id: string;
  secure_url: string;
  altText?: string;
}

export interface IProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  priceOverride?: number;
  images: IProductImage[];
  attributes?: { name: string; value: string }[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: mongoose.Types.ObjectId;
  brand?: string;
  images: IProductImage[];
  variants: IProductVariant[];
  price: number;
  compareAtPrice?: number;
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  isFeatured: boolean;
  salesCount: number;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  lowStockThreshold: number;
  ownershipType: 'PLATFORM' | 'VENDOR';
  vendorId?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  deletedBy?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productImageSchema = new Schema<IProductImage>({
  public_id: { type: String, required: true },
  secure_url: { type: String, required: true },
  altText: { type: String },
});

const productVariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  size: { type: String },
  color: { type: String },
  colorHex: { type: String },
  stock: { type: Number, required: true, default: 0, min: 0 },
  priceOverride: { type: Number, min: 0 },
  images: [productImageSchema],
  attributes: [{ name: { type: String }, value: { type: String } }],
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, index: true },
    images: [productImageSchema],
    variants: [productVariantSchema],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    tags: [{ type: String, index: true }],
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    salesCount: { type: Number, default: 0, index: true },
    viewCount: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
    lowStockThreshold: { type: Number, default: 5 },
    ownershipType: { type: String, enum: ['PLATFORM', 'VENDOR'], default: 'PLATFORM', index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ isFeatured: 1, status: 1 });
productSchema.index({ salesCount: -1, status: 1 });
productSchema.index({ createdAt: -1 });

// Sparse unique index for SKU
productSchema.index({ 'variants.sku': 1 }, { unique: true, sparse: true });

export const Product = mongoose.model<IProduct>('Product', productSchema);
