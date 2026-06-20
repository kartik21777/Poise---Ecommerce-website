import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryAllocation extends Document {
  product: mongoose.Types.ObjectId;
  variant?: mongoose.Types.ObjectId;
  location: mongoose.Types.ObjectId;
  availableQuantity: number;
  reservedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryAllocationSchema = new Schema<IInventoryAllocation>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId },
    location: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    availableQuantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

inventoryAllocationSchema.index({ product: 1, location: 1, variant: 1 }, { unique: true });

export const InventoryAllocation = mongoose.model<IInventoryAllocation>('InventoryAllocation', inventoryAllocationSchema);
