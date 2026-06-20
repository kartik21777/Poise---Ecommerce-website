import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryLocation extends Document {
  name: string;
  code: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  type: 'WAREHOUSE' | 'STORE' | '3PL' | 'DROP_SHIPPER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const inventoryLocationSchema = new Schema<IInventoryLocation>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    address: {
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    type: {
      type: String,
      enum: ['WAREHOUSE', 'STORE', '3PL', 'DROP_SHIPPER'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const InventoryLocation = mongoose.model<IInventoryLocation>('InventoryLocation', inventoryLocationSchema);
