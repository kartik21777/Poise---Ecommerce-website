import mongoose, { Document, Schema } from 'mongoose';

export type InventoryTransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface IInventoryTransfer extends Document {
  sourceLocation: mongoose.Types.ObjectId;
  destinationLocation: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variant?: mongoose.Types.ObjectId;
  quantity: number;
  status: InventoryTransferStatus;
  initiatedBy: mongoose.Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryTransferSchema = new Schema<IInventoryTransfer>(
  {
    sourceLocation: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    destinationLocation: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const InventoryTransfer = mongoose.model<IInventoryTransfer>('InventoryTransfer', inventoryTransferSchema);
