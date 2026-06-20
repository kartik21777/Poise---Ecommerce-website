import { paymentProviderRegistry } from './PaymentProviderRegistry.js';
import { GatewayHealthHistory, GatewayHealthState } from '../models/GatewayHealthHistory.js';
import { logger } from '../utils/logger.js';

const log = logger('GatewayHealthService');

export class GatewayHealthService {
  /**
   * Performs an active, safe health verification ping on a target gateway
   */
  async checkGatewayHealth(gateway: string): Promise<{
    status: GatewayHealthState;
    latencyMs: number;
    isSuccess: boolean;
    error?: string;
  }> {
    const key = gateway.toUpperCase();
    const startTime = Date.now();
    try {
      const provider = paymentProviderRegistry.getProvider(key);
      const meta = paymentProviderRegistry.getProviderMetadata(key);

      if (!meta.enabled) {
        throw new Error('Gateway is disabled in platform configuration.');
      }

      // Check if providers support actual remote checks. We also fall back to checking if credentials are configured
      if (key === 'RAZORPAY') {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keyId || !keySecret) {
          throw new Error('Incomplete credentials configured for Razorpay.');
        }
        // Remote check attempt
        await provider.fetchPayment('dummy_non_existent').catch((e: any) => {
          // If Razorpay returns a 400 Bad Request/Payment Not Found, that proves the gateway node is up and authenticated!
          if (e.statusCode && e.statusCode !== 401 && e.statusCode !== 403 && e.statusCode !== 500 && e.statusCode !== 502) {
            // Excellent, connection worked.
            return;
          }
          throw e;
        });
      } else if (key === 'STRIPE') {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
          throw new Error('Incomplete credentials configured for Stripe.');
        }
        // Remote checking credentials validity via retrieving a non-existent payment intent
        await provider.fetchPayment('pi_not_found').catch((e: any) => {
          // If Stripe API returns 404/400 (no such payment intent), connection + authentication succeeded!
          if (e.statusCode && e.statusCode !== 401 && e.statusCode !== 403 && e.statusCode !== 500 && e.statusCode !== 502) {
            return;
          }
          throw e;
        });
      }

      const latencyMs = Date.now() - startTime;
      const result = {
        status: latencyMs > 800 ? 'DEGRADED' as const : 'HEALTHY' as const,
        latencyMs,
        isSuccess: true,
      };

      // Record check to database history log
      await GatewayHealthHistory.create({
        gateway: key,
        status: result.status,
        latencyMs,
        isSuccess: true,
        checkedAt: new Date(),
      });

      return result;
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = err.message || String(err);
      log.error(`Active health check failed for gateway: ${key}`, { error: errorMessage, latencyMs });

      await GatewayHealthHistory.create({
        gateway: key,
        status: 'UNAVAILABLE' as const,
        latencyMs,
        isSuccess: false,
        errorMessage,
        checkedAt: new Date(),
      });

      return {
        status: 'UNAVAILABLE',
        latencyMs,
        isSuccess: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Run automated background audit sweeps for all registered providers
   */
  async performGlobalHealthAudit(): Promise<Record<string, any>> {
    const gateways = paymentProviderRegistry.getRegisteredGateways();
    const reports: Record<string, any> = {};

    for (const g of gateways) {
      if (g.gateway === 'COD') {
        reports.COD = { status: 'HEALTHY', latencyMs: 0, isSuccess: true };
        continue;
      }
      reports[g.gateway] = await this.checkGatewayHealth(g.gateway);
    }
    return reports;
  }

  /**
   * Resolves aggregated telemetry history trends: 24h, 7d, 30d
   */
  async getGatewayHealthHistory(gateway: string, rangeDays: number = 30) {
    const key = gateway.toUpperCase();
    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - rangeDays);

    const logs = await GatewayHealthHistory.find({
      gateway: key,
      checkedAt: { $gte: cutOff },
    }).sort({ checkedAt: -1 });

    const totalLogs = logs.length;
    if (totalLogs === 0) {
      return {
        gateway: key,
        rangeDays,
        uptimePercentage: 100,
        averageLatencyMs: 0,
        failureCount: 0,
        latencyTrends: [],
        outageWindows: [],
      };
    }

    const failureLogs = logs.filter(l => !l.isSuccess);
    const averageLatencyMs = Math.round(
      logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalLogs
    );

    const uptimePercentage = Number(
      (((totalLogs - failureLogs.length) / totalLogs) * 100).toFixed(2)
    );

    // Identify outage windows (sequential UNAVAILABLE spans)
    const outageWindows: Array<{ start: Date; end?: Date; reason?: string }> = [];
    let currentOutage: any = null;

    // Check sorted ascending to trace windows chronologically
    const sortedChronological = [...logs].reverse();
    for (const logItem of sortedChronological) {
      if (logItem.status === 'UNAVAILABLE') {
        if (!currentOutage) {
          currentOutage = {
            start: logItem.checkedAt,
            reason: logItem.errorMessage || 'Unknown system exhaustion',
          };
        }
      } else {
        if (currentOutage) {
          currentOutage.end = logItem.checkedAt;
          outageWindows.push(currentOutage);
          currentOutage = null;
        }
      }
    }
    if (currentOutage) {
      // Outage continues into the present
      outageWindows.push(currentOutage);
    }

    // Format trend chart points (e.g. grouped in subsets or simply raw series)
    const latencyTrends = logs.slice(0, 30).map(l => ({
      timestamp: l.checkedAt,
      latencyMs: l.latencyMs,
      status: l.status,
    })).reverse();

    return {
      gateway: key,
      rangeDays,
      uptimePercentage,
      averageLatencyMs,
      failureCount: failureLogs.length,
      latencyTrends,
      outageWindows: outageWindows.reverse(),
    };
  }
}

export const gatewayHealthService = new GatewayHealthService();
export default gatewayHealthService;
