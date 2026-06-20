import mongoose, { Document, Schema } from 'mongoose';

export interface IVendor extends Document {
  businessName: string;
  legalName: string;
  ownerUser: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  businessAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
  commissionRate: number; // e.g. 0.15 for 15%
  status: 'PENDING' | 'UNDER_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    businessName: { type: String, required: true },
    legalName: { type: String, required: true },
    ownerUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, required: true },
    businessAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    taxId: { type: String },
    commissionRate: { type: Number, required: true, default: 0.15, min: 0, max: 1 },
    status: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED'], default: 'PENDING', index: true },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes
vendorSchema.index({ status: 1, createdAt: -1 });

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);
