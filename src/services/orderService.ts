import { apiClient } from './apiClient.js';
import { Order, CheckoutPreviewResult } from '../types/index.js';

export const getCheckoutPreview = async (shippingAddressId?: string, couponCode?: string): Promise<CheckoutPreviewResult> => {
  const response = await apiClient.post<CheckoutPreviewResult>('/checkout/preview', { shippingAddressId, couponCode });
  return response.data;
};

export const createOrder = async (
  shippingAddressId: string,
  giftCardCodes?: string[],
  useStoreCredit?: boolean,
  couponCode?: string
): Promise<Order> => {
  const response = await apiClient.post<Order>('/orders', {
    shippingAddressId,
    giftCardCodes,
    useStoreCredit,
    couponCode,
  });
  return response.data;
};

export const getMyOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data;
};

export const getMyOrderDetails = async (id: string): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${id}`);
  return response.data;
};

export const getAdminOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/admin/orders');
  return response.data;
};

export const updateOrderStatus = async (
  id: string,
  status?: string,
  paymentStatus?: string
): Promise<Order> => {
  const response = await apiClient.put<Order>(`/admin/orders/${id}/status`, {
    status,
    paymentStatus,
  });
  return response.data;
};
