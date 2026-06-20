import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorOrderItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productSlug: string;
  image?: string;
  sku: string;
  attributes: { name: string; value: string }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IVendorOrder extends Document {
  vendorId: mongoose.Types.ObjectId;
  parentOrderId: mongoose.Types.ObjectId;
  customerUserId: mongoose.Types.ObjectId;
  orderNumber: string; // The same order number as the parent or slightly modified like ORD-123-V1
  items: IVendorOrderItem[];
  subtotal: number;
  tax: number; // For the vendor's portion
  shipping: number; // For the vendor's portion
  total: number; // Gross total for this vendor's part

  commissionRate: number; // Snapped at order time
  commissionAmount: number; // Platform cut
  netVendorRevenue: number; // total - tax (if tax is platform) / subtotal - commission

  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  fulfillmentStatus: 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'RETURNED';

  payoutId?: mongoose.Types.ObjectId;

  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  trackingNumber?: string;
  trackingCarrier?: string;

  createdAt: Date;
  updatedAt: Date;
}

const vendorOrderItemSchema = new Schema<IVendorOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  image: { type: String },
  sku: { type: String, required: true },
  attributes: [{ name: { type: String }, value: { type: String } }],
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }, // unitPrice * quantity
});

const vendorOrderSchema = new Schema<IVendorOrder>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    parentOrderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    items: [vendorOrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, min: 0 },

    commissionRate: { type: Number, required: true, min: 0, max: 1 },
    commissionAmount: { type: Number, required: true, min: 0 },
    netVendorRevenue: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'], default: 'PENDING', index: true },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'], default: 'UNPAID', index: true },
    fulfillmentStatus: { type: String, enum: ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'RETURNED'], default: 'UNFULFILLED' },

    payoutId: { type: Schema.Types.ObjectId, ref: 'VendorPayout', index: true },

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    trackingNumber: { type: String },
    trackingCarrier: { type: String },
  },
  { timestamps: true }
);

// Indexes
vendorOrderSchema.index({ vendorId: 1, createdAt: -1 });
vendorOrderSchema.index({ vendorId: 1, status: 1 });
vendorOrderSchema.index({ parentOrderId: 1, vendorId: 1 }, { unique: true });

export const VendorOrder = mongoose.model<IVendorOrder>('VendorOrder', vendorOrderSchema);
