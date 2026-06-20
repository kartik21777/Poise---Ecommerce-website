import Stripe from 'stripe';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import {
  PaymentProvider,
  NormalizedPaymentSession,
  NormalizedWebhookVerification,
  NormalizedPaymentDetails,
  NormalizedRefundResponse,
} from './PaymentProvider.js';

export class StripeProvider implements PaymentProvider {
  private getClient(): Stripe {
    const secretKey = env.stripe?.secretKey || process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new AppError(
        500,
        'Stripe configuration is incomplete. Missing STRIPE_SECRET_KEY.'
      );
    }
    return new Stripe(secretKey, {
      apiVersion: '2022-11-15' as any, // Maintain stable API compatibility
    });
  }

  async createPaymentSession(
    orderId: string,
    amount: number,
    currency: string,
    checkoutSessionId: string
  ): Promise<NormalizedPaymentSession> {
    try {
      const stripe = this.getClient();

      // Convert amount to cents/subunits
      const unitAmount = Math.round(amount * 100);
      const stripeCurrency = (currency || 'USD').toLowerCase();

      const successUrl = `${env.clientUrl || env.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&checkoutSessionId=${checkoutSessionId}`;
      const cancelUrl = `${env.clientUrl || env.appUrl}/checkout/cancel?checkoutSessionId=${checkoutSessionId}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: stripeCurrency,
              product_data: {
                name: `Checkout Purchase (Order Ref #${orderId})`,
                description: 'Secure dynamic order acquisition session.',
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          orderId,
          checkoutSessionId,
        },
      });

      return {
        checkoutSessionId,
        gatewayOrderId: session.id,
        amount,
        currency: currency || 'USD',
        gateway: 'STRIPE',
        paymentLink: session.url || undefined,
        rawResponse: session,
      };
    } catch (error: any) {
      console.error('Stripe Checkout Session Initiation Failed:', error);
      throw new AppError(
        502,
        `Stripe checkout session creation failed: ${error.message || error}`
      );
    }
  }

  async verifyWebhook(
    headers: Record<string, any>,
    rawBody: string
  ): Promise<NormalizedWebhookVerification> {
    try {
      const stripe = this.getClient();
      const signature = headers['stripe-signature'] as string;
      const webhookSecret = env.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature) {
        return { isValid: false, eventId: '', eventType: '', rawPayload: null };
      }

      let event: Stripe.Event;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } else {
        console.warn('STRIPE_WEBHOOK_SECRET is blank. Verification bypassed for sandbox/staging test simulation.');
        event = JSON.parse(rawBody) as Stripe.Event;
      }

      const eventId = event.id;
      const eventType = event.type;

      let gatewayOrderId: string | undefined;
      let gatewayPaymentId: string | undefined;
      let amount: number | undefined;
      let status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PENDING' | undefined;
      let failureReason: string | undefined;

      switch (eventType) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          gatewayOrderId = session.id;
          gatewayPaymentId = session.payment_intent as string;
          amount = session.amount_total ? session.amount_total / 100 : undefined;
          status = 'CAPTURED';
          break;
        }
        case 'payment_intent.succeeded': {
          const pi = event.data.object as Stripe.PaymentIntent;
          gatewayPaymentId = pi.id;
          gatewayOrderId = pi.id; // checkout fallback reference can be itself if session was completed earlier
          amount = pi.amount_received ? pi.amount_received / 100 : undefined;
          status = 'CAPTURED';
          break;
        }
        case 'payment_intent.payment_failed': {
          const pi = event.data.object as Stripe.PaymentIntent;
          gatewayPaymentId = pi.id;
          gatewayOrderId = pi.id;
          status = 'FAILED';
          failureReason = pi.last_payment_error?.message || 'Payment intent captured failure on Stripe network.';
          break;
        }
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          gatewayPaymentId = charge.payment_intent as string;
          status = 'REFUNDED';
          amount = charge.amount_refunded ? charge.amount_refunded / 100 : undefined;
          break;
        }
        default:
          // For other unhandled Stripe events, return basic valid struct
          break;
      }

      return {
        isValid: true,
        eventId,
        eventType,
        gatewayOrderId,
        gatewayPaymentId,
        amount,
        status,
        failureReason,
        rawPayload: event,
      };
    } catch (err: any) {
      console.error('Stripe Webhook Parsing Violation Error:', err);
      return {
        isValid: false,
        eventId: `err_${Date.now()}`,
        eventType: 'WEBHOOK_VERIFICATION_EXCEPTION',
        failureReason: err.message,
        rawPayload: err,
      };
    }
  }

  async fetchPayment(gatewayPaymentId: string): Promise<NormalizedPaymentDetails> {
    try {
      const stripe = this.getClient();
      const pi = await stripe.paymentIntents.retrieve(gatewayPaymentId);

      let normalizedStatus:
        | 'CREATED'
        | 'PENDING'
        | 'AUTHORIZED'
        | 'CAPTURED'
        | 'FAILED'
        | 'REFUNDED' = 'PENDING';

      if (pi.status === 'succeeded') {
        normalizedStatus = 'CAPTURED';
      } else if (pi.status === 'requires_capture') {
        normalizedStatus = 'AUTHORIZED';
      } else if (pi.status === 'canceled') {
        normalizedStatus = 'FAILED';
      } else if (pi.status === 'processing') {
        normalizedStatus = 'PENDING';
      } else if (pi.status === 'requires_payment_method' || pi.status === 'requires_action') {
        normalizedStatus = 'CREATED';
      }

      return {
        gatewayPaymentId: pi.id,
        gatewayOrderId: pi.id, // Reference intent directly for search
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        status: normalizedStatus,
        failureReason: pi.last_payment_error?.message || undefined,
        rawResponse: pi,
      };
    } catch (error: any) {
      console.error('Stripe Payment Intent Query Failed:', error);
      throw new AppError(
        502,
        `Failed to retrieve payment intent from Stripe: ${error.message || error}`
      );
    }
  }

  async refundPayment(
    gatewayPaymentId: string,
    amount: number,
    reason?: string
  ): Promise<NormalizedRefundResponse> {
    try {
      const stripe = this.getClient();
      const amountInCents = Math.round(amount * 100);

      const refund = await stripe.refunds.create({
        payment_intent: gatewayPaymentId,
        amount: amountInCents,
        reason: reason ? ('requested_by_customer' as any) : undefined,
        metadata: {
          refundReasonText: reason || 'Merchant Direct Administration Refund',
        },
      });

      let normalizedStatus: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING';
      if (refund.status === 'succeeded') {
        normalizedStatus = 'COMPLETED';
      } else if (refund.status === 'failed') {
        normalizedStatus = 'FAILED';
      } else if (refund.status === 'pending') {
        normalizedStatus = 'PROCESSING';
      }

      return {
        gatewayRefundId: refund.id,
        amount,
        status: normalizedStatus,
        rawResponse: refund,
      };
    } catch (error: any) {
      console.error('Stripe Refund Allocation Failed:', error);
      throw new AppError(
        502,
        `Stripe refund execution failed: ${error.message || error}`
      );
    }
  }
}
