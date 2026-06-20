import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import {
  PaymentProvider,
  NormalizedPaymentSession,
  NormalizedWebhookVerification,
  NormalizedPaymentDetails,
  NormalizedRefundResponse,
} from './PaymentProvider.js';

export class RazorpayProvider implements PaymentProvider {
  private getClient(): any {
    const keyId = env.razorpay?.keyId || process.env.RAZORPAY_KEY_ID;
    const keySecret = env.razorpay?.keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new AppError(
        500,
        'Razorpay configuration is incomplete. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.'
      );
    }

    // Handle ESM or CommonJS resolution wrapper safely If needed
    const RazorpayClass = (Razorpay as any).default || Razorpay;
    return new RazorpayClass({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createPaymentSession(
    orderId: string,
    amount: number,
    currency: string,
    checkoutSessionId: string
  ): Promise<NormalizedPaymentSession> {
    try {
      const client = this.getClient();

      // Convert to subunit (paise)
      const razorpayAmount = Math.round(amount * 100);

      const razorpayOrder = await client.orders.create({
        amount: razorpayAmount,
        currency: currency || 'INR',
        receipt: orderId,
        notes: {
          checkoutSessionId,
        },
      });

      return {
        checkoutSessionId,
        gatewayOrderId: razorpayOrder.id,
        amount,
        currency: currency || 'INR',
        gateway: 'RAZORPAY',
        rawResponse: razorpayOrder,
      };
    } catch (error: any) {
      console.error('Razorpay Order Creation Failed:', error);
      throw new AppError(
        502,
        `Razorpay checkout session creation failed: ${error.message || error}`
      );
    }
  }

  async verifyWebhook(
    headers: Record<string, any>,
    rawBody: string
  ): Promise<NormalizedWebhookVerification> {
    const signature = headers['x-razorpay-signature'] as string;
    const webhookSecret = env.razorpay?.webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) {
      return { isValid: false, eventId: '', eventType: '', rawPayload: null };
    }

    if (!webhookSecret) {
      console.warn('RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signature check is bypassed for testing.');
    }

    const isValid = webhookSecret
      ? crypto
          .createHmac('sha256', webhookSecret)
          .update(rawBody)
          .digest('hex') === signature
      : true;

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return { isValid: false, eventId: '', eventType: '', rawPayload: null };
    }

    const eventId = payload.id || `evt_${Date.now()}`;
    const eventType = payload.event || '';
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    let status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PENDING' | undefined;
    if (paymentEntity?.status === 'captured') {
      status = 'CAPTURED';
    } else if (paymentEntity?.status === 'authorized') {
      status = 'AUTHORIZED';
    } else if (paymentEntity?.status === 'failed') {
      status = 'FAILED';
    } else if (paymentEntity?.status === 'refunded') {
      status = 'REFUNDED';
    }

    return {
      isValid,
      eventId,
      eventType,
      gatewayOrderId: orderEntity?.id || paymentEntity?.order_id,
      gatewayPaymentId: paymentEntity?.id,
      amount: paymentEntity?.amount ? paymentEntity.amount / 100 : undefined,
      status,
      failureReason: paymentEntity?.error_description,
      rawPayload: payload,
    };
  }

  async fetchPayment(gatewayPaymentId: string): Promise<NormalizedPaymentDetails> {
    try {
      const client = this.getClient();
      const payment = await client.payments.fetch(gatewayPaymentId);

      let normalizedStatus:
        | 'CREATED'
        | 'PENDING'
        | 'AUTHORIZED'
        | 'CAPTURED'
        | 'FAILED'
        | 'REFUNDED' = 'PENDING';

      if (payment.status === 'captured') {
        normalizedStatus = 'CAPTURED';
      } else if (payment.status === 'authorized') {
        normalizedStatus = 'AUTHORIZED';
      } else if (payment.status === 'failed') {
        normalizedStatus = 'FAILED';
      } else if (payment.status === 'refunded') {
        normalizedStatus = 'REFUNDED';
      } else if (payment.status === 'created') {
        normalizedStatus = 'CREATED';
      }

      return {
        gatewayPaymentId: payment.id,
        gatewayOrderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: normalizedStatus,
        failureReason: payment.error_description,
        rawResponse: payment,
      };
    } catch (error: any) {
      console.error('Razorpay Payment Retrieval Failed:', error);
      throw new AppError(
        502,
        `Failed to retrieve payment from Razorpay: ${error.message || error}`
      );
    }
  }

  async refundPayment(
    gatewayPaymentId: string,
    amount: number,
    reason?: string
  ): Promise<NormalizedRefundResponse> {
    try {
      const client = this.getClient();
      const razorpayAmount = Math.round(amount * 100);

      const refund = await client.payments.refund(gatewayPaymentId, {
        amount: razorpayAmount,
        notes: {
          reason: reason || 'Merchant refund',
        },
      });

      let normalizedStatus: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING';
      if (refund.status === 'processed') {
        normalizedStatus = 'COMPLETED';
      } else if (refund.status === 'failed') {
        normalizedStatus = 'FAILED';
      }

      return {
        gatewayRefundId: refund.id,
        amount,
        status: normalizedStatus,
        rawResponse: refund,
      };
    } catch (error: any) {
      console.error('Razorpay Refund Request failed:', error);
      throw new AppError(
        502,
        `Razorpay refund initiation failed: ${error.message || error}`
      );
    }
  }
}
