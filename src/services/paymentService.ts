import { apiClient } from './apiClient.js';

export interface PaymentSessionResponse {
  success: boolean;
  checkoutSessionId: string;
  transactionId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  gateway: 'RAZORPAY' | 'STRIPE';
  paymentLink?: string;
  razorpayKeyId?: string;
}

export interface PaymentTransaction {
  _id: string;
  transactionId: string;
  order: string;
  user: string;
  gateway: 'RAZORPAY' | 'STRIPE' | 'COD';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
  attemptNumber: number;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const createPaymentSession = async (orderId: string, gateway: 'RAZORPAY' | 'STRIPE' = 'RAZORPAY'): Promise<PaymentSessionResponse> => {
  const response = await apiClient.post<PaymentSessionResponse>('/payments/create-session', { orderId, gateway });
  return response.data;
};

export const getOrderTransactions = async (orderId: string): Promise<PaymentTransaction[]> => {
  const response = await apiClient.get<PaymentTransaction[]>(`/payments/order/${orderId}`);
  return response.data;
};

export const getAdminTransactions = async (filters?: { status?: string; gateway?: string; orderId?: string }): Promise<PaymentTransaction[]> => {
  const response = await apiClient.get<PaymentTransaction[]>('/admin/payments', { params: filters });
  return response.data;
};
