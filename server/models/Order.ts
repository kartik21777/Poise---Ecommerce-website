import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
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

export interface IShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddressSnapshot;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  inventoryDeducted: boolean;
  currency: string;
  exchangeRateVersion?: mongoose.Types.ObjectId;
  exchangeRateUsed: number;
  regionalPricingSource?: string;
  taxSnapshot?: any;
  giftCardAllocations?: {
    giftCardId: mongoose.Types.ObjectId;
    code: string;
    amount: number; // in order currency
    amountInCardCurrency: number;
  }[];
  storeCreditUsed?: number; // amount in order currency
  gatewayAmountUsed?: number; // amount in order currency
  loyaltyPointsUsed?: number;
  loyaltyAmountUsed?: number;
  couponCode?: string;
  promoDiscountAmount?: number;
  appliedPromotionSnaps?: {
    promotionId: mongoose.Types.ObjectId;
    name: string;
    type: string;
    discountAmount: number;
    loyaltyMultiplier?: number;
  }[];
  // Omnichannel Support
  source: 'WEB' | 'MOBILE' | 'POS' | 'MARKETPLACE' | 'MANUAL';
  sourceReference?: string;
  storeLocation?: mongoose.Types.ObjectId;
  terminal?: string;
  employee?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productSlug: { type: String, required: true },
  image: { type: String },
  sku: { type: String, required: true },
  attributes: [
    {
      name: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 },
});

const shippingAddressSnapshotSchema = new Schema<IShippingAddressSnapshot>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: false });

const orderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: [orderItemSchema],
    shippingAddress: { type: shippingAddressSnapshotSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        'PENDING',
        'PAYMENT_PENDING',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      index: true,
    },
    inventoryDeducted: {
      type: Boolean,
      default: false,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      index: true,
    },
    exchangeRateVersion: {
      type: Schema.Types.ObjectId,
      ref: 'ExchangeRateVersion',
    },
    exchangeRateUsed: {
      type: Number,
      required: true,
      default: 1,
    },
    regionalPricingSource: {
      type: String,
    },
    taxSnapshot: {
      type: Schema.Types.Mixed,
    },
    giftCardAllocations: [
      {
        giftCardId: { type: Schema.Types.ObjectId, ref: 'GiftCard' },
        code: { type: String },
        amount: { type: Number },
        amountInCardCurrency: { type: Number },
      }
    ],
    storeCreditUsed: {
      type: Number,
      default: 0,
    },
    gatewayAmountUsed: {
      type: Number,
      default: 0,
    },
    loyaltyPointsUsed: {
      type: Number,
      default: 0,
    },
    loyaltyAmountUsed: {
      type: Number,
      default: 0,
    },
    couponCode: { type: String },
    promoDiscountAmount: { type: Number, default: 0 },
    appliedPromotionSnaps: [
      {
        promotionId: { type: Schema.Types.ObjectId, ref: 'Promotion' },
        name: { type: String },
        type: { type: String },
        discountAmount: { type: Number },
        loyaltyMultiplier: { type: Number },
      }
    ],
    // Omnichannel & POS extensions
    source: {
      type: String,
      enum: ['WEB', 'MOBILE', 'POS', 'MARKETPLACE', 'MANUAL'],
      default: 'WEB',
      index: true,
    },
    sourceReference: {
      type: String, // e.g. Amazon Order ID, POS Transaction ID
      index: true,
    },
    storeLocation: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryLocation',
      index: true,
    },
    terminal: { type: String },
    employee: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const Order = mongoose.model<IOrder>('Order', orderSchema);
