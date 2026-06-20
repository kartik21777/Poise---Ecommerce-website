import { Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PaymentService } from '../services/PaymentService.js';
import { WebhookProcessingService } from '../services/WebhookProcessingService.js';
import { RefundService } from '../services/RefundService.js';
import { ReconciliationService } from '../services/ReconciliationService.js';
import { WebhookRecoveryService } from '../services/WebhookRecoveryService.js';
import { PaymentDispute } from '../models/PaymentDispute.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';
import { GatewayConfig } from '../models/GatewayConfig.js';
import { gatewayHealthService } from '../services/GatewayHealthService.js';
import { sloMetricsService } from '../services/SLOMetricsService.js';

const paymentService = new PaymentService();
const webhookProcessingService = new WebhookProcessingService();
const refundService = new RefundService();
const reconciliationService = new ReconciliationService();
const webhookRecoveryService = new WebhookRecoveryService();

/**
 * POST /api/payments/checkout-session
 * Creates a gateway-agnostic checkout session for an order
 */
export const createCheckoutSession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { orderId, gateway = 'RAZORPAY' } = req.body;

    if (!orderId) {
      throw new AppError(400, 'orderId is required');
    }

    if (gateway !== 'RAZORPAY' && gateway !== 'STRIPE') {
      throw new AppError(400, 'Unsupported payment gateway selection');
    }

    const result = await paymentService.initializePaymentSession(orderId, userId, gateway);

    const publicRazorpayKeyId = env.razorpay?.keyId || process.env.RAZORPAY_KEY_ID || '';

    res.status(201).json({
      success: true,
      checkoutSessionId: result.transaction.transactionId,
      transactionId: result.transaction.transactionId,
      gatewayOrderId: result.session.gatewayOrderId,
      amount: result.session.amount,
      currency: result.session.currency,
      gateway: result.session.gateway,
      paymentLink: result.session.paymentLink,
      razorpayKeyId: publicRazorpayKeyId,
    });
  }
);

/**
 * GET /api/payments/order/:orderId
 * Fetch transaction audit tracing for a user's own order
 */
export const getMyOrderTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.params;

    const transactions = await paymentService.getOrderTransactions(orderId, userId);
    res.json(transactions);
  }
);

/**
 * GET /api/admin/payments
 * Filter and view all platform payment transactions (Admin only)
 */
export const getAdminTransactions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { status, gateway, orderId } = req.query;

    const transactions = await paymentService.getAllTransactions({
      status: status ? String(status) : undefined,
      gateway: gateway ? String(gateway) : undefined,
      orderId: orderId ? String(orderId) : undefined,
    });

    res.json(transactions);
  }
);

/**
 * POST /api/webhooks/razorpay
 * Listen and verify webhook event feeds from standard Razorpay gateway endpoints
 */
export const handleRazorpayWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Extract raw body from request metadata. If express parser consumed it, fall back to stringified json body.
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const headers = req.headers;

  const result = await webhookProcessingService.processRazorpayWebhook(headers, rawBody);

  res.status(200).json(result);
});

/**
 * POST /api/admin/payments/refund
 * Administrative endpoint to trigger payment refund execution. Only accessible by Admins.
 */
export const adminCreateRefund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { paymentTransactionId, amount, reason, idempotencyKey } = req.body;
  if (!paymentTransactionId || !amount) {
    throw new AppError(400, 'paymentTransactionId and amount are required.');
  }

  const result = await refundService.executeRefund({
    paymentTransactionId,
    amount: Number(amount),
    reason,
    idempotencyKey,
  });

  res.status(200).json(result);
});

/**
 * POST /api/admin/payments/refunds/:refundId/retry
 * Administrative endpoint to retry a failed refund.
 */
export const adminRetryRefund = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refundId } = req.params;
  const result = await refundService.retryFailedRefund(refundId);
  res.status(200).json(result);
});

/**
 * GET /api/admin/payments/refunds
 * List all refund transactions.
 */
export const adminGetAllRefunds = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const refunds = await refundService.getAllRefunds();
  res.status(200).json(refunds);
});

/**
 * GET /api/admin/payments/reconciliation
 * Run active platform synchronization and reconciliation analytics.
 */
export const adminRunReconciliation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : 30;
  const report = await reconciliationService.runReconciliation(days);
  res.status(200).json(report);
});

/**
 * POST /api/admin/payments/webhooks/reprocess
 * Administratively reprocess failed or stale webhook events.
 */
export const adminReprocessWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.body;
  if (!eventId) {
    throw new AppError(400, 'eventId is required to re-run execution rules.');
  }
  const result = await webhookRecoveryService.reprocessEvent(eventId);
  res.status(200).json(result);
});

/**
 * GET /api/admin/payments/exceptions
 * Retrieve exceptions list including failed webhooks and dead-letter records.
 */
export const adminGetPaymentExceptions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const exceptions = await webhookRecoveryService.getExceptions();
  res.status(200).json(exceptions);
});

/**
 * GET /api/admin/payments/disputes
 * List all dispute tracking items.
 */
export const adminGetDisputes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const disputes = await PaymentDispute.find()
    .sort({ createdAt: -1 })
    .populate('order', 'orderNumber total status')
    .populate('paymentTransaction', 'transactionId gatewayPaymentId amount status');
  res.status(200).json(disputes);
});

/**
 * POST /api/admin/payments/disputes
 * Create or modify a manual Dispute record for platform tracking.
 */
export const adminCreateOrUpdateDispute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { disputeId, paymentTransactionId, orderId, amount, status, reason, evidenceDetails, filedAt } = req.body;

  let dispute;

  if (disputeId) {
    dispute = await PaymentDispute.findOne({ disputeId });
    if (!dispute) {
      throw new AppError(404, `Dispute ${disputeId} not found.`);
    }

    if (status) dispute.status = status;
    if (reason !== undefined) dispute.reason = reason;
    if (evidenceDetails !== undefined) dispute.evidenceDetails = evidenceDetails;
    if (status === 'WON' || status === 'LOST') {
      dispute.resolvedAt = new Date();
    }
    await dispute.save();
  } else {
    if (!paymentTransactionId || !orderId || !amount) {
      throw new AppError(400, 'paymentTransactionId, orderId, and amount are required to open a dispute log.');
    }

    const uniqueId = `disp_${crypto.randomBytes(6).toString('hex')}`;
    dispute = new PaymentDispute({
      disputeId: uniqueId,
      paymentTransaction: paymentTransactionId,
      order: orderId,
      amount: Number(amount),
      status: status || 'DISPUTE_OPENED',
      reason,
      evidenceDetails,
      filedAt: filedAt ? new Date(filedAt) : new Date(),
    });
    await dispute.save();
  }

  res.status(200).json(dispute);
});

/**
 * GET /api/admin/payments/gateways/config
 * Retrieves dynamic routing configuration metadata
 */
export const adminGetGatewayConfigs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const configs = await GatewayConfig.find({}).sort({ routingPriority: -1 });
  res.status(200).json(configs);
});

/**
 * POST /api/admin/payments/gateways/config
 * Admin API to create/modify routing priority and enable status for a payment provider
 */
export const adminUpdateGatewayConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gateway, name, enabled, routingPriority, failoverPriority, supportedCurrencies, supportedCountries, paymentMethods, settings } = req.body;
  
  if (!gateway) {
    throw new AppError(400, 'gateway identifier is required.');
  }

  const key = gateway.toUpperCase();
  let config = await GatewayConfig.findOne({ gateway: key });

  if (config) {
    if (name !== undefined) config.name = name;
    if (enabled !== undefined) config.enabled = enabled;
    if (routingPriority !== undefined) config.routingPriority = routingPriority;
    if (failoverPriority !== undefined) config.failoverPriority = failoverPriority;
    if (supportedCurrencies !== undefined) config.supportedCurrencies = supportedCurrencies;
    if (supportedCountries !== undefined) config.supportedCountries = supportedCountries;
    if (paymentMethods !== undefined) config.paymentMethods = paymentMethods;
    if (settings !== undefined) config.settings = settings;
    await config.save();
  } else {
    config = new GatewayConfig({
      gateway: key,
      name: name || `${key} Automated Gateway Connection`,
      enabled: enabled !== undefined ? enabled : true,
      routingPriority: routingPriority || 5,
      failoverPriority: failoverPriority || 5,
      supportedCurrencies: supportedCurrencies || ['INR', 'USD'],
      supportedCountries: supportedCountries || [],
      paymentMethods: paymentMethods || ['card'],
      settings: settings || {},
    });
    await config.save();
  }

  res.status(200).json(config);
});

/**
 * GET /api/admin/payments/gateways/health
 * Returns immediate health status check for all platforms
 */
export const adminGetGatewayHealthStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await gatewayHealthService.performGlobalHealthAudit();
  res.status(200).json(result);
});

/**
 * GET /api/admin/payments/gateways/health/history/:gateway
 * Retrieve uptime trend details and latency averages over designated timeframe range (defaults to 30d)
 */
export const adminGetGatewayHealthHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gateway } = req.params;
  const { timeframe } = req.query; // optional range query
  const days = timeframe ? Number(timeframe) : 30;

  const result = await gatewayHealthService.getGatewayHealthHistory(gateway, days);
  res.status(200).json(result);
});

/**
 * GET /api/admin/payments/gateways/slo/:gateway
 * Real-time analytics of Service Level Objectives and remainders of Error Budgets
 */
export const adminGetGatewaySLOMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gateway } = req.params;
  const { timeframe } = req.query;
  const days = timeframe ? Number(timeframe) : 30;

  const result = await sloMetricsService.calculateSLOMetrics(gateway, days);
  res.status(200).json(result);
});

/**
 * POST /api/admin/payments/gateways/health/check
 * Diagnostic route to force trigger a health scan
 */
export const adminTriggerManualGatewayHealthCheck = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gateway } = req.body;
  if (!gateway) {
    throw new AppError(400, 'gateway identifier is required for diagnostic ping.');
  }
  const result = await gatewayHealthService.checkGatewayHealth(gateway);
  res.status(200).json(result);
});

/**
 * POST /api/webhooks/:gateway
 * Gateway-agnostic unified incoming webhook processor
 */
export const handleGenericGatewayWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { gateway } = req.params;
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);
  const headers = req.headers;

  const result = await webhookProcessingService.processGatewayWebhook(gateway, headers, rawBody);
  res.status(200).json(result);
});

