import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { PaymentTransaction, PaymentTransactionStatus } from '../models/PaymentTransaction.js';
import { IdempotencyKey } from '../models/IdempotencyKey.js';
import { Product } from '../models/Product.js';
import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { PaymentProvider, NormalizedPaymentSession } from './PaymentProvider.js';
import { paymentRoutingService } from './PaymentRoutingService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { lockService } from './LockService.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';

const log = logger('PaymentService');

export class PaymentService {
  private getProvider(gateway: 'RAZORPAY' | 'STRIPE' | string): PaymentProvider {
    return paymentProviderRegistry.getProvider(gateway);
  }


  /**
   * Initializes a new payment session for an existing Order
   */
  async initializePaymentSession(
    orderId: string,
    userId: string,
    gateway: 'RAZORPAY' | 'STRIPE' | string = 'RAZORPAY',
    country?: string,
    currency?: string
  ): Promise<{ transaction: any; session: NormalizedPaymentSession }> {
    const lockKey = `lock:payment:order:${orderId}`;
    
    return await lockService.withLock(lockKey, 15000, async () => {
      log.info(`Initializing payment session for order`, { orderId, userId, gateway, country, currency });

      // 1. Fetch and validate order
      const order = await Order.findOne({ _id: orderId, user: userId });
      if (!order) {
        log.warn(`Order not found for payment session init`, { orderId, userId });
        throw new AppError(404, 'Order not found');
      }

      if (order.paymentStatus === 'PAID') {
        throw new AppError(400, 'This order has already been fully paid.');
      }

      if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
        throw new AppError(400, `Cannot pay for an order in terminal state: ${order.status}`);
      }

      // SECTION 13.9: Cart Snapshot & Pricing Validation
      const productIds = order.items.map(item => item.productId);
      const products = await Product.find({ _id: { $in: productIds } });

      for (const item of order.items) {
        const productDoc = products.find(p => p._id.toString() === item.productId.toString());
        if (!productDoc) {
          throw new AppError(400, `Stale checkout: Product "${item.productName}" has been removed from the catalog. Please create a new order.`);
        }
        const variant = productDoc.variants?.find((v: any) => v.sku === item.sku);
        if (!variant) {
          throw new AppError(400, `Stale checkout: Variant SKU "${item.sku}" is no longer available in the catalog. Please create a new order.`);
        }
        // Determine the catalog price for the variant
        const catalogPrice = variant.priceOverride !== undefined ? variant.priceOverride : productDoc.price;
        // Check if price has fluctuated from captured order price
        if (catalogPrice !== item.unitPrice) {
          throw new AppError(400, `Stale checkout: Catalog price for "${item.productName}" has changed from ₹${item.unitPrice} to ₹${catalogPrice}. Please create a new order with revised prices.`);
        }
      }

      // SECTION 13.11: Payment Session Expiration & Stale Attempt Cleanup
      // De-activate old unfinished transactions to avoid infinite pending attempts
      await PaymentTransaction.updateMany(
        { order: order._id, status: { $in: ['CREATED', 'PENDING', 'AUTHORIZED'] } },
        { $set: { status: 'EXPIRED', failureReason: 'Superseded by a newer payment retry attempt.' } }
      );

      // Section 5: Smart Dynamic Routing
      let chosenGateway = await paymentRoutingService.determineOptimalGateway({
        country,
        currency,
        amount: order.total,
        explicitGateway: gateway,
      });

      // 2. Persisted Idempotency Key Setup for Checkout Session ID
      const checkoutSessionId = `chk_sess_${crypto.randomUUID()}`;
      const idempotencyRecord = new IdempotencyKey({
        key: checkoutSessionId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
      });
      await idempotencyRecord.save();

      // 3. Request Gateway Session creation with automatic failover (Section 6)
      let session: NormalizedPaymentSession;
      let provider = this.getProvider(chosenGateway);
      const startTime = Date.now();

      // Retrieve locked currency from primary order to prevent database drift
      const orderCurrency = (order.currency || currency || 'USD').toUpperCase();

      try {
        session = await provider.createPaymentSession(
          order.id,
          order.total,
          orderCurrency,
          checkoutSessionId
        );
      } catch (err: any) {
        log.warn(`Primary gateway ${chosenGateway} session creation failed. Initiating automatic failover.`, { error: err.message });

        // Execute failover routing safely (Section 6 & 6.5)
        const failoverResult = await paymentRoutingService.failoverToNextGateway({
          orderId: order.id,
          failedGateway: chosenGateway,
          lastError: err.message || 'Gateway connection exception.',
        });

        chosenGateway = failoverResult.gateway;
        provider = this.getProvider(chosenGateway);

        session = await provider.createPaymentSession(
          order.id,
          order.total,
          orderCurrency,
          checkoutSessionId
        ).catch((failoverErr: any) => {
          log.error(`Critical double failover exception:`, { error: failoverErr.message });
          throw new AppError(502, `Payment initialization failed on both primary and failover gateways. Latest error: ${failoverErr.message}`);
        });
      }

      const latencyMs = Date.now() - startTime;

      // 4. Calculate attempt index
      const previousAttempts = await PaymentTransaction.countDocuments({ order: order._id });
      const attemptNumber = previousAttempts + 1;

      // 5. Create PaymentTransaction log
      const transaction = new PaymentTransaction({
        transactionId: checkoutSessionId,
        order: order._id,
        user: order.user._id,
        gateway: chosenGateway as any,
        gatewayOrderId: session.gatewayOrderId,
        amount: order.total,
        currency: orderCurrency,
        status: 'CREATED' as PaymentTransactionStatus,
        attemptNumber,
        metadata: {
          checkoutSessionId,
          gatewayResponse: session.rawResponse,
        },
      });

      await transaction.save();

      // Clean up or complete idempotency trace
      idempotencyRecord.status = 'COMPLETED';
      idempotencyRecord.responseBody = {
        transactionId: transaction.transactionId,
        gatewayOrderId: session.gatewayOrderId,
      };
      idempotencyRecord.responseStatus = 200;
      await idempotencyRecord.save();

      // Log to analytics foundation asynchronously
      PaymentAnalytics.create({
        metricType: 'WEBHOOK_LATENCY', // capture initialization latency
        gateway: chosenGateway as any,
        amount: order.total,
        orderId: order._id,
        transactionId: checkoutSessionId,
        latencyMs,
        metadata: {
          action: 'payment_session_init',
          attemptNumber,
        },
      }).catch(e => log.error('Failed to log payment session init metrics', { error: e.message }));

      log.info(`Payment session initialized successfully`, { 
        orderId, 
        transactionId: checkoutSessionId, 
        gatewayOrderId: session.gatewayOrderId,
        gateway: chosenGateway,
        latencyMs 
      });

      return {
        transaction,
        session,
      };
    });
  }

  /**
   * Retrieves audit trace history for an order
   */
  async getOrderTransactions(orderId: string, userId?: string) {
    const query: Record<string, any> = { order: orderId };
    if (userId) {
      query.user = userId;
    }
    return await PaymentTransaction.find(query).sort({ createdAt: -1 });
  }

  /**
   * Admin-level transaction query list
   */
  async getAllTransactions(filters: {
    status?: string;
    gateway?: string;
    orderId?: string;
  } = {}) {
    const query: Record<string, any> = {};
    if (filters.status) query.status = filters.status;
    if (filters.gateway) query.gateway = filters.gateway;
    if (filters.orderId) query.order = filters.orderId;

    return await PaymentTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber total status')
      .populate('user', 'name email');
  }
}
