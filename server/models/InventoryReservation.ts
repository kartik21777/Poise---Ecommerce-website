import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryReservation extends Document {
  order: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  variant?: mongoose.Types.ObjectId;
  quantity: number;
  warehouse: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' | 'RELEASED';
  createdAt: Date;
  updatedAt: Date;
}

const inventoryReservationSchema = new Schema<IInventoryReservation>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId },
    quantity: { type: Number, required: true, min: 1 },
    warehouse: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED', 'RELEASED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

inventoryReservationSchema.index({ status: 1, expiresAt: 1 });

export const InventoryReservation = mongoose.model<IInventoryReservation>('InventoryReservation', inventoryReservationSchema);
