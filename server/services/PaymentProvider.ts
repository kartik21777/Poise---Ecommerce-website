export interface NormalizedPaymentSession {
  checkoutSessionId: string;
  gatewayOrderId: string; // Order ID or Checkout intent ID returned by primary gateway
  amount: number;
  currency: string;
  gateway: 'RAZORPAY' | 'STRIPE';
  paymentLink?: string; // Required for popups or external flow redirections
  rawResponse: any;
}

export interface NormalizedWebhookVerification {
  isValid: boolean;
  eventId: string;
  eventType: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amount?: number; // In base units (e.g. Rupee decimal, or already converted if needed)
  status?: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PENDING';
  failureReason?: string;
  rawPayload: any;
}

export interface NormalizedPaymentDetails {
  gatewayPaymentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  status: 'CREATED' | 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  failureReason?: string;
  rawResponse: any;
}

export interface NormalizedRefundResponse {
  gatewayRefundId: string;
  amount: number;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  rawResponse: any;
}

export interface PaymentProvider {
  createPaymentSession(
    orderId: string,
    amount: number,
    currency: string,
    checkoutSessionId: string
  ): Promise<NormalizedPaymentSession>;

  verifyWebhook(
    headers: Record<string, any>,
    rawBody: string
  ): Promise<NormalizedWebhookVerification>;

  fetchPayment(gatewayPaymentId: string): Promise<NormalizedPaymentDetails>;

  refundPayment(
    gatewayPaymentId: string,
    amount: number,
    reason?: string
  ): Promise<NormalizedRefundResponse>;
}
