export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  image?: string;
  sku: string;
  attributes: { name: string; value: string }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  user: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddressSnapshot;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  updatedAt: string;
  userContext?: {
    name: string;
    email: string;
  };
}

export interface CheckoutPreviewResult {
  subtotal: number;
  discountedSubtotal: number;
  promoDiscountAmount: number;
  couponDiscountAmount: number;
  appliedCouponCode: string | null;
  appliedPromotionSnaps: any[];
  loyaltyMultiplier: number;
  currency: string;
  shipping: number;
  tax: number;
  total: number;
  warnings: string[];
}
