import { IOrder } from '../models/Order.js';

export interface OrderItemResponse {
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

export interface ShippingAddressResponse {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderResponse {
  id: string;
  user: string;
  orderNumber: string;
  items: OrderItemResponse[];
  shippingAddress: ShippingAddressResponse;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  currency?: string;
  exchangeRateUsed?: number;
  regionalPricingSource?: string;
  taxSnapshot?: any;
  createdAt: string;
  updatedAt: string;
}

export const toOrderDto = (order: IOrder): OrderResponse => {
  return {
    id: order._id.toString(),
    user: order.user.toString(),
    orderNumber: order.orderNumber,
    items: order.items.map(item => ({
      productId: item.productId.toString(),
      productName: item.productName,
      productSlug: item.productSlug,
      image: item.image,
      sku: item.sku,
      attributes: item.attributes.map(attr => ({
        name: attr.name,
        value: attr.value,
      })),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      phone: order.shippingAddress.phone,
      addressLine1: order.shippingAddress.addressLine1,
      addressLine2: order.shippingAddress.addressLine2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
    },
    subtotal: order.subtotal,
    shipping: order.shipping,
    tax: order.tax,
    total: order.total,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: order.currency || 'USD',
    exchangeRateUsed: order.exchangeRateUsed || 1.0,
    regionalPricingSource: order.regionalPricingSource,
    taxSnapshot: order.taxSnapshot,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
};
