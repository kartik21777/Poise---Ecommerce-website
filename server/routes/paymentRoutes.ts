import { Router } from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  createCheckoutSession,
  getMyOrderTransactions,
  getAdminTransactions,
  handleRazorpayWebhook,
  adminCreateRefund,
  adminRetryRefund,
  adminGetAllRefunds,
  adminRunReconciliation,
  adminReprocessWebhook,
  adminGetPaymentExceptions,
  adminGetDisputes,
  adminCreateOrUpdateDispute,
  adminGetGatewayConfigs,
  adminUpdateGatewayConfig,
  adminGetGatewayHealthStatus,
  adminGetGatewayHealthHistory,
  adminGetGatewaySLOMetrics,
  adminTriggerManualGatewayHealthCheck,
  handleGenericGatewayWebhook,
} from '../controllers/paymentController.js';

const router = Router();

// Customer Endpoints
router.post('/payments/checkout-session', requireAuth, createCheckoutSession);
router.post('/payments/create-session', requireAuth, createCheckoutSession);
router.get('/payments/order/:orderId', requireAuth, getMyOrderTransactions);

// Admin Endpoints
router.get('/admin/payments', requireAuth, authorize('admin'), getAdminTransactions);
router.post('/admin/payments/refund', requireAuth, authorize('admin'), adminCreateRefund);
router.post('/admin/payments/refunds/:refundId/retry', requireAuth, authorize('admin'), adminRetryRefund);
router.get('/admin/payments/refunds', requireAuth, authorize('admin'), adminGetAllRefunds);
router.get('/admin/payments/reconciliation', requireAuth, authorize('admin'), adminRunReconciliation);
router.post('/admin/payments/webhooks/reprocess', requireAuth, authorize('admin'), adminReprocessWebhook);
router.get('/admin/payments/exceptions', requireAuth, authorize('admin'), adminGetPaymentExceptions);
router.get('/admin/payments/disputes', requireAuth, authorize('admin'), adminGetDisputes);
router.post('/admin/payments/disputes', requireAuth, authorize('admin'), adminCreateOrUpdateDispute);

// Gateway Management Admin Endpoints
router.get('/admin/payments/gateways/config', requireAuth, authorize('admin'), adminGetGatewayConfigs);
router.post('/admin/payments/gateways/config', requireAuth, authorize('admin'), adminUpdateGatewayConfig);
router.get('/admin/payments/gateways/health', requireAuth, authorize('admin'), adminGetGatewayHealthStatus);
router.get('/admin/payments/gateways/health/history/:gateway', requireAuth, authorize('admin'), adminGetGatewayHealthHistory);
router.get('/admin/payments/gateways/slo/:gateway', requireAuth, authorize('admin'), adminGetGatewaySLOMetrics);
router.post('/admin/payments/gateways/health/check', requireAuth, authorize('admin'), adminTriggerManualGatewayHealthCheck);

// Public Webhook listeners
router.post('/webhooks/razorpay', handleRazorpayWebhook);
router.post('/webhooks/:gateway', handleGenericGatewayWebhook);

export default router;
