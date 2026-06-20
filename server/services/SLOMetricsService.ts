import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { RefundTransaction } from '../models/RefundTransaction.js';
import { PaymentAnalytics } from '../models/PaymentAnalytics.js';
import { GatewayHealthHistory } from '../models/GatewayHealthHistory.js';
import { logger } from '../utils/logger.js';

const log = logger('SLOMetricsService');

export interface ISLOMetricsReport {
  gateway: string;
  timeframeDays: number;
  paymentSuccessRate: {
    targetPercent: number;
    actualPercent: number;
    errorBudgetPercentRemaining: number;
    totalAttempts: number;
    successAttempts: number;
    failedAttempts: number;
  };
  refundSuccessRate: {
    targetPercent: number;
    actualPercent: number;
    errorBudgetPercentRemaining: number;
    totalRefundAttempts: number;
    completedRefunds: number;
    failedRefunds: number;
  };
  webhookLatencyMs: {
    targetMs: number;
    actualAverageMs: number;
    sloMetPercent: number;
  };
  overallHealthStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
}

export class SLOMetricsService {
  /**
   * Generates a concrete, real-time SLO metrics evaluation for a given gateway
   */
  async calculateSLOMetrics(gateway: string, timeframeDays: number = 30): Promise<ISLOMetricsReport> {
    const key = gateway.toUpperCase();
    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - timeframeDays);

    log.info(`Generating real-time SLO and Error Budget reports`, { gateway: key, timeframeDays });

    // 1. Calculate Payment Success Rate SLO
    const totalPayments = await PaymentTransaction.find({
      gateway: key as any,
      createdAt: { $gte: cutOff },
      status: { $in: ['CAPTURED', 'FAILED'] },
    });

    const totalCount = totalPayments.length;
    const capturedCount = totalPayments.filter(p => p.status === 'CAPTURED').length;
    const paymentSuccessPercent = totalCount > 0 ? Number(((capturedCount / totalCount) * 100).toFixed(2)) : 100;

    // Target SLA is 95% for payments success. Limit/budget calculation:
    const targetPaymentSLA = 95.0;
    const paymentErrorRate = 100 - paymentSuccessPercent;
    const maxAllowedErrorRate = 100 - targetPaymentSLA;
    const paymentBudgetRemaining = maxAllowedErrorRate > 0 
      ? Number((Math.max(0, (maxAllowedErrorRate - paymentErrorRate) / maxAllowedErrorRate) * 100).toFixed(2)) 
      : 100;

    // 2. Calculate Refund Success Rate SLO (Target 99.0%)
    const totalRefunds = await RefundTransaction.find({
      createdAt: { $gte: cutOff },
      status: { $in: ['COMPLETED', 'FAILED'] },
    }).populate({
      path: 'paymentTransaction',
      match: { gateway: key as any },
    });

    // Filter refunds associated with the target gateway
    const filteredRefunds = totalRefunds.filter(r => r.paymentTransaction !== null);
    const totalRefundCount = filteredRefunds.length;
    const completedRefundCount = filteredRefunds.filter(r => r.status === 'COMPLETED').length;
    const refundSuccessPercent = totalRefundCount > 0 ? Number(((completedRefundCount / totalRefundCount) * 100).toFixed(2)) : 100;

    const targetRefundSLA = 99.0;
    const refundErrorRate = 100 - refundSuccessPercent;
    const maxAllowedRefundErrorRate = 100 - targetRefundSLA;
    const refundBudgetRemaining = maxAllowedRefundErrorRate > 0
      ? Number((Math.max(0, (maxAllowedRefundErrorRate - refundErrorRate) / maxAllowedRefundErrorRate) * 100).toFixed(2))
      : 100;

    // 3. Calculate Webhook Processing Latency SLO (Target < 2000ms)
    const analytics = await PaymentAnalytics.find({
      gateway: key as any,
      metricType: 'WEBHOOK_LATENCY',
      createdAt: { $gte: cutOff },
    });

    const averageLatencyMs = analytics.length > 0 
      ? Math.round(analytics.reduce((sum, item) => sum + (item.latencyMs || 0), 0) / analytics.length)
      : 120; // Fast default in case of clear backlog

    const targetLatencyMs = 2000;
    const latencySloMetPercent = analytics.length > 0
      ? Number(((analytics.filter(a => (a.latencyMs || 0) <= targetLatencyMs).length / analytics.length) * 100).toFixed(2))
      : 100;

    // 4. Fetch overall status (based on the latest 5 active health checks)
    const recentChecks = await GatewayHealthHistory.find({
      gateway: key,
    }).sort({ checkedAt: -1 }).limit(5);

    let overallHealthStatus: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' = 'HEALTHY';
    if (recentChecks.length > 0) {
      const failures = recentChecks.filter(c => !c.isSuccess).length;
      if (failures >= 3) {
        overallHealthStatus = 'UNAVAILABLE';
      } else if (failures >= 1 || averageLatencyMs > 1500) {
        overallHealthStatus = 'DEGRADED';
      }
    }

    return {
      gateway: key,
      timeframeDays,
      paymentSuccessRate: {
        targetPercent: targetPaymentSLA,
        actualPercent: paymentSuccessPercent,
        errorBudgetPercentRemaining: paymentBudgetRemaining,
        totalAttempts: totalCount,
        successAttempts: capturedCount,
        failedAttempts: totalCount - capturedCount,
      },
      refundSuccessRate: {
        targetPercent: targetRefundSLA,
        actualPercent: refundSuccessPercent,
        errorBudgetPercentRemaining: refundBudgetRemaining,
        totalRefundAttempts: totalRefundCount,
        completedRefunds: completedRefundCount,
        failedRefunds: totalRefundCount - completedRefundCount,
      },
      webhookLatencyMs: {
        targetMs: targetLatencyMs,
        actualAverageMs: averageLatencyMs,
        sloMetPercent: latencySloMetPercent,
      },
      overallHealthStatus,
    };
  }
}

export const sloMetricsService = new SLOMetricsService();
export default sloMetricsService;
