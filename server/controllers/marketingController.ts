import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { Coupon, ICoupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Promotion } from '../models/Promotion.js';
import { CustomerSegment } from '../models/CustomerSegment.js';
import { EmailCampaign } from '../models/EmailCampaign.js';
import { Experiment } from '../models/Experiment.js';
import { Vendor } from '../models/Vendor.js';
import { Cart } from '../models/Cart.js';
import { promotionEngineService } from '../services/PromotionEngineService.js';
import { customerSegmentationService } from '../services/CustomerSegmentationService.js';
import { recommendationService } from '../services/RecommendationService.js';
import { marketingAutomationService } from '../services/MarketingAutomationService.js';
import { marketingAnalyticsService } from '../services/MarketingAnalyticsService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Resolve Vendor Helpers
const getReqVendor = async (userId: any) => {
  return await Vendor.findOne({ ownerUser: userId });
};

/**
 * ============================================================================
 * SECTION 1 & 11 — COUPON CONTROLLERS (WITH VENDOR ISOLATION)
 * ============================================================================
 */

export const getCoupons = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query: any = {};

  // If user has a Vendor role, filter to only return coupons they own
  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    query.vendorId = vendor._id;
    query.vendorScope = 'VENDOR';
  }

  const coupons = await Coupon.find(query).sort({ createdAt: -1 });
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;

  // Strict Vendor Boundaries
  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    payload.vendorScope = 'VENDOR';
    payload.vendorId = vendor._id;
  } else {
    payload.vendorScope = payload.vendorScope || 'GLOBAL';
  }

  const exists = await Coupon.findOne({ code: payload.code.toUpperCase() });
  if (exists) {
    throw new AppError(400, `Coupon with code "${payload.code}" already exists.`);
  }

  const coupon = new Coupon({
    ...payload,
    code: payload.code.toUpperCase(),
  });

  await coupon.save();
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new AppError(404, 'Coupon not found');

  // Enforce Vendor Isolation
  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor || coupon.vendorId?.toString() !== vendor._id.toString()) {
      throw new AppError(403, 'Permission denied. Vendor campaign isolation breach.');
    }
    // Prevent switching scope to global
    delete req.body.vendorScope;
    delete req.body.vendorId;
  }

  Object.assign(coupon, req.body);
  await coupon.save();
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new AppError(404, 'Coupon not found');

  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor || coupon.vendorId?.toString() !== vendor._id.toString()) {
      throw new AppError(403, 'Permission denied');
    }
  }

  await coupon.deleteOne();
  res.status(204).send();
});

/**
 * ============================================================================
 * SECTION 2 — PROMOTION CONTROLLERS
 * ============================================================================
 */

export const getPromotions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query: any = {};

  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    query.vendorId = vendor._id;
    query.vendorScope = 'VENDOR';
  }

  const promotions = await Promotion.find(query).sort({ priority: -1, createdAt: -1 });
  res.json(promotions);
});

export const createPromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = req.body;

  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor) throw new AppError(404, 'Vendor profile not found');
    payload.vendorScope = 'VENDOR';
    payload.vendorId = vendor._id;
  }

  const promotion = new Promotion(payload);
  await promotion.save();
  res.status(201).json(promotion);
});

export const updatePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) throw new AppError(404, 'Promotion not found');

  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor || promotion.vendorId?.toString() !== vendor._id.toString()) {
      throw new AppError(403, 'Permission denied');
    }
    delete req.body.vendorScope;
    delete req.body.vendorId;
  }

  Object.assign(promotion, req.body);
  await promotion.save();
  res.json(promotion);
});

export const deletePromotion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) throw new AppError(404, 'Promotion not found');

  if ((req.user?.role as string) === 'vendor') {
    const vendor = await getReqVendor(req.user._id);
    if (!vendor || promotion.vendorId?.toString() !== vendor._id.toString()) {
      throw new AppError(403, 'Permission denied');
    }
  }

  await promotion.deleteOne();
  res.status(204).send();
});

/**
 * ============================================================================
 * SECTION 3 — PROMOTION EVALUATION & CHECKOUT INTEGRATION CONTROLLER
 * ============================================================================
 */

export const checkoutCalculateDiscounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { couponCode } = req.body;

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.json({
      promoDiscountAmount: 0,
      couponDiscountAmount: 0,
      eligiblePromotions: [],
      subtotalWithDiscounts: 0,
    });
  }

  // Map to format that PromotionEngine expects
  const formattedItems = cart.items.map((item: any) => ({
    productId: item.product._id.toString(),
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));

  const discounts = await promotionEngineService.evaluateDiscounts(userId, formattedItems, couponCode);
  res.json(discounts);
});

/**
 * ============================================================================
 * SECTION 4 — CUSTOMER SEGMENTATION CONTROLLERS
 * ============================================================================
 */

export const getSegments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const segments = await CustomerSegment.find({ status: 'ACTIVE' });
  res.json(segments);
});

export const createSegment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const segment = new CustomerSegment(req.body);
  await segment.save();
  res.status(201).json(segment);
});

/**
 * ============================================================================
 * SECTION 5 — RECOMMENDATION CONTROLLERS
 * ============================================================================
 */

export const getPersonalizedRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 8;
  let recs = [];
  if (req.user) {
    recs = await recommendationService.getPersonalizedRecommendations(req.user.id, limit);
  } else {
    recs = await recommendationService.getTrendingProducts(limit);
  }
  res.json(recs);
});

export const getRelatedFBTRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 4;
  const recs = await recommendationService.getFrequentlyBoughtTogether(productId, limit);
  res.json(recs);
});

/**
 * ============================================================================
 * SECTION 6 & 7 — ABANDONED CART RECOVERY & EMAIL CAMPAIGNS CONTROLLERS
 * ============================================================================
 */

export const triggerAbandonedCartCron = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campaignsCreated = await marketingAutomationService.generateAbandonedCartRecoveryCampaigns();
  res.json({ success: true, campaignsCreated });
});

export const getCampaigns = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campaigns = await EmailCampaign.find({}).sort({ createdAt: -1 });
  res.json(campaigns);
});

export const createCampaign = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const campaign = new EmailCampaign(req.body);
  await campaign.save();
  res.status(201).json(campaign);
});

/**
 * ============================================================================
 * SECTION 7.5 — MARKETING CONSENT MANAGEMENT CONTROLLERS
 * ============================================================================
 */

export const updateConsentPreference = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { emailOptIn, smsOptIn, pushOptIn, consentSource } = req.body;
  if (req.user) {
    const pref = await marketingAutomationService.updateConsent(
      req.user.id,
      !!emailOptIn,
      !!smsOptIn,
      !!pushOptIn,
      consentSource || 'CHECKOUT'
    );
    return res.json(pref);
  }
  throw new AppError(400, 'User authentication required');
});

/**
 * ============================================================================
 * SECTION 8 — MARKETING LEVELED ANALYTICS CONTROLLER
 * ============================================================================
 */

export const getMarketingMetrics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Prevent unauthorized vendor eyes on global stats (admin only)
  if (req.user?.role !== 'admin') {
    throw new AppError(403, 'Permission denied. Administration access required.');
  }

  const analytics = await marketingAnalyticsService.getMarketingOverview();
  res.json(analytics);
});

/**
 * ============================================================================
 * SECTION 9 — ATTRIBUTION TRACKING CONTROLLER
 * ============================================================================
 */

export const trackAttributionEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { visitorId, source, medium, campaign, referral, landingPage } = req.body;
  const success = await marketingAutomationService.trackAttribution(
    visitorId,
    source,
    medium,
    campaign,
    referral,
    landingPage,
    req.user?.id
  );
  res.json({ success });
});

/**
 * ============================================================================
 * SECTION 10 — A/B TESTING & EXPERIMENTS CONTROLLERS
 * ============================================================================
 */

export const getExperiments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const experiments = await Experiment.find({ status: 'ACTIVE' });
  res.json(experiments);
});

export const createExperiment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const experiment = new Experiment(req.body);
  await experiment.save();
  res.status(201).json(experiment);
});

export const getExperimentAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { experimentName, visitorId } = req.body;
  if (!experimentName || !visitorId) {
    throw new AppError(400, 'experimentName and visitorId are required');
  }

  const variant = await marketingAutomationService.assignUserToExperiment(
    experimentName,
    visitorId,
    req.user?.id
  );
  res.json({ variant });
});
