import mongoose, { Document, Schema } from 'mongoose';

export type FulfillmentStatus = 'PENDING' | 'ACCEPTED' | 'PICKING' | 'PACKING' | 'READY_FOR_PICKUP' | 'SHIPPED' | 'CANCELLED';

export interface IFulfillmentRequest extends Document {
  warehouse: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  fulfillmentProvider: mongoose.Types.ObjectId;
  shipmentReference?: string;
  status: FulfillmentStatus;
  items: {
    productId: mongoose.Types.ObjectId;
    variantId?: mongoose.Types.ObjectId;
    quantity: number;
    shippedQuantity: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const fulfillmentRequestSchema = new Schema<IFulfillmentRequest>(
  {
    warehouse: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    fulfillmentProvider: { type: Schema.Types.ObjectId, ref: 'WarehouseProvider', required: true },
    shipmentReference: { type: String, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'PICKING', 'PACKING', 'READY_FOR_PICKUP', 'SHIPPED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId },
        quantity: { type: Number, required: true, min: 1 },
        shippedQuantity: { type: Number, default: 0, min: 0 },
      }
    ],
  },
  {
    timestamps: true,
  }
);

fulfillmentRequestSchema.index({ order: 1, warehouse: 1, fulfillmentProvider: 1 }, { unique: true });

export const FulfillmentRequest = mongoose.model<IFulfillmentRequest>('FulfillmentRequest', fulfillmentRequestSchema);
