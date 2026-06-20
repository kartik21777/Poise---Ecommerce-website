import mongoose from 'mongoose';
import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { GatewayConfig, IGatewayConfig } from '../models/GatewayConfig.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const log = logger('PaymentRoutingService');

export class PaymentRoutingService {
  /**
   * Safe Seeding: Ensures basic dynamic configs exist in db on server load if empty
   */
  async ensureDefaultGatewayConfigs(): Promise<void> {
    try {
      const counts = await GatewayConfig.countDocuments();
      if (counts === 0) {
        log.info('Seeding dynamic gateway routing config tables for production runtime.');
        await GatewayConfig.create([
          {
            gateway: 'RAZORPAY',
            name: 'Razorpay Indian Local Gateway',
            enabled: true,
            routingPriority: 10, // Default Indian routing is higher priority
            failoverPriority: 5,
            supportedCurrencies: ['INR', 'USD'],
            supportedCountries: ['IN'],
            paymentMethods: ['card', 'upi', 'netbanking', 'wallet'],
            settings: { maxAmountLimit: 500000 },
          },
          {
            gateway: 'STRIPE',
            name: 'Stripe Global International Gateway',
            enabled: true,
            routingPriority: 5, // Globally active, lower default in India
            failoverPriority: 10, // Preferred for international failbacks
            supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
            supportedCountries: [], // Universal empty array = global support
            paymentMethods: ['card'],
            settings: { supportsApplePay: true },
          },
        ]);
      }
    } catch (err: any) {
      log.error('Gateway config seeding warning', { error: err.message });
    }
  }

  /**
   * Section 5: Smart dynamic routing execution based on client parameters
   */
  async determineOptimalGateway(params: {
    country?: string;
    currency?: string;
    amount: number;
    explicitGateway?: string;
  }): Promise<string> {
    await this.ensureDefaultGatewayConfigs();

    // 1. Explicit Gateway Support
    if (params.explicitGateway) {
      const config = await GatewayConfig.findOne({ gateway: params.explicitGateway.toUpperCase(), enabled: true });
      if (!config) {
        throw new AppError(400, `Selected gateway ${params.explicitGateway} is disabled or unavailable.`);
      }
      return config.gateway;
    }

    // 2. Fetch all enabled routable configurations
    const activeConfigs = await GatewayConfig.find({ enabled: true }).sort({ routingPriority: -1 });

    if (activeConfigs.length === 0) {
      log.warn('No active payment gateway routers are enabled in administrative panel. Defaulting to general baseline RAZORPAY.');
      return 'RAZORPAY';
    }

    const country = params.country?.toUpperCase() || 'IN';
    const currency = params.currency?.toUpperCase() || 'INR';

    // 3. Match country and currency priorities
    for (const config of activeConfigs) {
      const countryMatches =
        config.supportedCountries.length === 0 ||
        config.supportedCountries.map(c => c.toUpperCase()).includes(country);

      const currencyMatches =
        config.supportedCurrencies.length === 0 ||
        config.supportedCurrencies.map(c => c.toUpperCase()).includes(currency);

      if (countryMatches && currencyMatches) {
        log.info(`Smart Gateway Match Succeeded: Selected ${config.gateway}`, { country, currency });
        return config.gateway;
      }
    }

    // 4. Default baseline fallback
    log.info(`No precise rules match for parameters. Defaulting to highest-priority active gateway: ${activeConfigs[0].gateway}`);
    return activeConfigs[0].gateway;
  }

  /**
   * Section 6 & 6.5: Failover Safety Evaluator & Multi-Gateway Failover routing
   */
  async failoverToNextGateway(params: {
    orderId: string;
    failedGateway: string;
    lastError: string;
  }): Promise<{ gateway: string; order: any; previousTransaction: any }> {
    const { orderId, failedGateway, lastError } = params;
    const targetGateway = failedGateway.toUpperCase();

    log.warn(`Initiating active gateway failover sequence`, { orderId, failedGateway });

    // 1. Locate Order
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Associated order not found for failover execution.');
    }

    // 2. Locate the failed checkout session transaction
    const previousTx = await PaymentTransaction.findOne({
      order: order._id,
      gateway: targetGateway as any,
      status: { $in: ['CREATED', 'PENDING', 'AUTHORIZED', 'FAILED'] },
    } as any).sort({ createdAt: -1 });

    if (!previousTx) {
      throw new AppError(404, `No recorded transaction found for Order ${orderId} on gateway ${failedGateway} to failover.`);
    }

    // 3. SECTION 6.5 — Failover Safety check! Verify original payment is not captured on the gateway node
    if (previousTx.gatewayPaymentId) {
      try {
        const provider = paymentProviderRegistry.getProvider(targetGateway);
        const remoteStatus = await provider.fetchPayment(previousTx.gatewayPaymentId);

        if (remoteStatus.status === 'CAPTURED' || remoteStatus.status === 'AUTHORIZED') {
          // Double-charging protection safeguard! Trigger recovery but refuse failover routing as money has already cleared!
          log.error(`FAILOVER BLOCK: Original transaction has active captured state at the gateway level. Bypassing failover to prevent double charges.`, {
            gatewayPaymentId: previousTx.gatewayPaymentId,
            remoteStatus: remoteStatus.status,
          });

          // Self-heal local db State
          if (remoteStatus.status === 'CAPTURED') {
            previousTx.status = 'CAPTURED';
            await previousTx.save();
            order.paymentStatus = 'PAID';
            order.status = 'PAID';
            await order.save();
          }

          throw new AppError(409, `Failover aborted safely: Payment has already been CAPTURED/AUTHORIZED on the original gateway (${failedGateway}). Local status has been synchronatively synced.`);
        }
      } catch (checkErr: any) {
        log.warn(`Failover safety verification query failed (perhaps un-created/expired gateway session). Proceeding cautiously.`, { error: checkErr.message });
      }
    }

    // 4. Retrieve candidate gateways that aren't the failed one
    const availableConfigs = await GatewayConfig.find({
      enabled: true,
      gateway: { $ne: targetGateway },
    }).sort({ failoverPriority: -1 });

    if (availableConfigs.length === 0) {
      throw new AppError(503, 'Global failover exhausted: No alternative secondary payment gateways are enabled inside the system.');
    }

    const nextGateway = availableConfigs[0].gateway;

    // 5. Expiration of original failed transaction attempt
    previousTx.status = 'FAILED';
    previousTx.failureReason = `Gateway Failover Triggered: Bypassed due to original failure: ${lastError}`;
    await previousTx.save();

    // 6. Audit failover history
    await AuditLog.create({
      action: 'GATEWAY_FAILOVER',
      entityType: 'Order',
      entityId: order._id.toString(),
      payload: {
        orderNumber: order.orderNumber,
        originalGateway: targetGateway,
        failoverGateway: nextGateway,
        errorThatTriggeredFailover: lastError,
        originalTransactionId: previousTx.transactionId,
      },
      reason: 'Automated gateway failover recovery processing.',
    });

    log.info(`Active system failover successfully routed`, {
      originalGateway: targetGateway,
      newGateway: nextGateway,
      order: order.orderNumber,
    });

    return {
      gateway: nextGateway,
      order,
      previousTransaction: previousTx,
    };
  }
}

export const paymentRoutingService = new PaymentRoutingService();
export default paymentRoutingService;
