import mongoose from 'mongoose';
import { Coupon, ICoupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Promotion, IPromotion } from '../models/Promotion.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const log = logger('PromotionEngineService');

export interface EvaluatedPromotionResult {
  promotionId: string;
  name: string;
  type: string;
  discountAmount: number;
  loyaltyMultiplier: number;
}

export interface DiscountCalculationResult {
  promoDiscountAmount: number;
  couponDiscountAmount: number;
  eligiblePromotions: EvaluatedPromotionResult[];
  subtotalWithDiscounts: number;
  appliedCouponCode?: string;
  loyaltyMultiplier: number; // Max of all applicable multipliers or baseline 1.0
}

export class PromotionEngineService {
  /**
   * Validates a coupon code for a given user, cart value, and optional vendor scope
   */
  async validateCoupon(
    code: string,
    userId: string,
    cartSubtotal: number,
    cartItems: { productId: string; lineTotal: number }[],
    productMap?: Map<string, unknown>
  ): Promise<ICoupon> {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      throw new AppError(404, `Coupon with code "${code}" not found`);
    }

    if (coupon.status !== 'ACTIVE') {
      throw new AppError(400, 'Coupon is not active');
    }

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) {
      throw new AppError(400, 'Coupon validity period has not started yet');
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new AppError(400, 'Coupon has expired');
    }

    // Check overall usage limits
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      throw new AppError(400, 'Coupon usage limit has been reached');
    }

    // Check user-specific limits
    if (coupon.usagePerUser) {
      const userRedemptionCount = await CouponRedemption.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        couponId: coupon._id,
      });

      if (userRedemptionCount >= coupon.usagePerUser) {
        throw new AppError(400, `You have reached the maximum usage limit (${coupon.usagePerUser}) for this coupon`);
      }
    }

    // Subtotal minimum checks
    const targetSubtotal = await this.calculateApplicableSubtotal(coupon, cartItems, cartSubtotal, productMap);
    if (coupon.minimumOrderValue && targetSubtotal < coupon.minimumOrderValue) {
      throw new AppError(400, `Coupon requires a minimum order value of $${coupon.minimumOrderValue} for eligible products`);
    }

    return coupon;
  }

  /**
   * Evaluates and applies promotions + optional coupon to cart contents
   */
  async evaluateDiscounts(
    userId: string | undefined, // undefined for guest checkout calculations if applicable (defaults to no segment rules)
    cartItems: { productId: string; variantSku: string; quantity: number; unitPrice: number; lineTotal: number }[],
    couponCode?: string
  ): Promise<DiscountCalculationResult> {
    const subtotal = cartItems.reduce((acc, item) => acc + item.lineTotal, 0);
    let promoDiscountAmount = 0;
    let couponDiscountAmount = 0;
    let finalLoyaltyMultiplier = 1.0;
    const appliedPromos: EvaluatedPromotionResult[] = [];

    // Preload Products to eliminate N+1 queries
    const productIds = [...new Set(cartItems.map((i) => i.productId))];
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, unknown>();
    products.forEach((p) => productMap.set(p._id.toString(), p));

    // Get all ACTIVE, applicable promotions sorted by Priority (highest first)
    const now = new Date();
    const activePromotions = await Promotion.find({
      status: 'ACTIVE',
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } },
          ],
        }
      ]
    }).sort({ priority: -1 });

    // Track original vs remaining line values for cascading stacking discounts
    const remainingLineTotals = new Map<string, number>();
    cartItems.forEach((item) => {
      remainingLineTotals.set(`${item.productId}-${item.variantSku}`, item.lineTotal);
    });

    // Evaluate automatic promotions
    for (const promo of activePromotions) {
      let isEligible = false;

      // 1. Minimum Cart Value check
      if (promo.conditions.minCartValue && subtotal < promo.conditions.minCartValue) {
        continue;
      }

      // 2. Category checks
      if (promo.conditions.requiredCategoryIds && promo.conditions.requiredCategoryIds.length > 0) {
        // Find if any item in cart belongs to required categories
        const itemsInCategories = this.filterItemsByCategoriesSync(cartItems, promo.conditions.requiredCategoryIds, productMap);
        if (itemsInCategories.length === 0) continue;
      }

      // 3. Product requirement checks
      if (promo.conditions.requiredProductIds && promo.conditions.requiredProductIds.length > 0) {
        const matchingItems = cartItems.filter((i) =>
          promo.conditions.requiredProductIds!.some((id) => id.toString() === i.productId)
        );
        if (matchingItems.length === 0) continue;
      }

      // If we passed all conditions, we can evaluate promo rewards
      let promoDiscountAdded = 0;

      if (promo.type === 'CART_DISCOUNT') {
        const curRemainingSubtotal = Array.from(remainingLineTotals.values()).reduce((a, b) => a + b, 0);
        if (promo.rewards.discountType === 'PERCENTAGE') {
          promoDiscountAdded = Number((curRemainingSubtotal * (promo.rewards.discountValue / 100)).toFixed(2));
        } else if (promo.rewards.discountType === 'FIXED_AMOUNT') {
          promoDiscountAdded = Math.min(promo.rewards.discountValue, curRemainingSubtotal);
        }

        // Deduct proportionally from items
        const ratio = curRemainingSubtotal > 0 ? (curRemainingSubtotal - promoDiscountAdded) / curRemainingSubtotal : 0;
        remainingLineTotals.forEach((val, key) => {
          remainingLineTotals.set(key, Number((val * ratio).toFixed(2)));
        });

        isEligible = promoDiscountAdded > 0;
      } else if (promo.type === 'PRODUCT_DISCOUNT' || promo.type === 'CATEGORY_DISCOUNT') {
        const targetProductIds = promo.rewards.targetProductIds?.map((id) => id.toString()) || [];
        const targetCategoryIds = promo.rewards.targetCategoryIds || [];

        for (const item of cartItems) {
          const key = `${item.productId}-${item.variantSku}`;
          const currentVal = remainingLineTotals.get(key) || 0;
          if (currentVal <= 0) continue;

          let isItemTarget = false;
          if (targetProductIds.length > 0 && targetProductIds.includes(item.productId)) {
            isItemTarget = true;
          } else if (targetCategoryIds.length > 0) {
            const hasCategory = this.filterItemsByCategoriesSync([item], targetCategoryIds, productMap);
            if (hasCategory.length > 0) {
              isItemTarget = true;
            }
          }

          // Also scope to vendor if the promotion is vendor-specific
          if (promo.vendorScope === 'VENDOR' && promo.vendorId) {
            const productDoc = productMap.get(item.productId) as { vendorId?: mongoose.Types.ObjectId };
            if (!productDoc || productDoc.vendorId?.toString() !== promo.vendorId.toString()) {
              isItemTarget = false;
            }
          }

          if (isItemTarget) {
            let itemDiscount = 0;
            if (promo.rewards.discountType === 'PERCENTAGE') {
              itemDiscount = Number((currentVal * (promo.rewards.discountValue / 100)).toFixed(2));
            } else if (promo.rewards.discountType === 'FIXED_AMOUNT') {
              itemDiscount = Math.min(promo.rewards.discountValue * item.quantity, currentVal);
            }

            remainingLineTotals.set(key, Number((currentVal - itemDiscount).toFixed(2)));
            promoDiscountAdded += itemDiscount;
          }
        }
        isEligible = promoDiscountAdded > 0;
      } else if (promo.type === 'BUY_X_GET_Y') {
        const buyQty = promo.conditions.buyQuantity || 1;
        const getYQty = promo.conditions.getYQuantity || 1;
        const requiredIds = promo.conditions.requiredProductIds?.map((id) => id.toString()) || [];

        const eligibleItems = cartItems.filter((i) => requiredIds.includes(i.productId));
        const totalEligibleQty = eligibleItems.reduce((acc, current) => acc + current.quantity, 0);

        if (totalEligibleQty >= buyQty) {
          const setsOfPromo = Math.floor(totalEligibleQty / buyQty);
          // Reward: free or discounted Y items
          const targetIds = promo.rewards.targetProductIds?.map((id) => id.toString()) || requiredIds;

          let triggerCount = setsOfPromo * getYQty;
          // Apply free discount to those items in cart
          for (const item of cartItems) {
            if (triggerCount <= 0) break;
            if (targetIds.includes(item.productId)) {
              const key = `${item.productId}-${item.variantSku}`;
              const currentVal = remainingLineTotals.get(key) || 0;
              if (currentVal <= 0) continue;

              const applyOnQty = Math.min(item.quantity, triggerCount);
              const originalUnitPrice = item.unitPrice;

              let quantityDiscount = 0;
              if (promo.rewards.discountType === 'PERCENTAGE') {
                quantityDiscount = Number((applyOnQty * originalUnitPrice * (promo.rewards.discountValue / 100)).toFixed(2));
              } else if (promo.rewards.discountType === 'FIXED_AMOUNT') {
                quantityDiscount = Math.min(promo.rewards.discountValue * applyOnQty, currentVal);
              }

              remainingLineTotals.set(key, Number((currentVal - quantityDiscount).toFixed(2)));
              promoDiscountAdded += quantityDiscount;
              triggerCount -= applyOnQty;
            }
          }
          isEligible = promoDiscountAdded > 0;
        }
      } else if (promo.type === 'LOYALTY_MULTIPLIER') {
        if (promo.rewards.pointsMultiplier && promo.rewards.pointsMultiplier > finalLoyaltyMultiplier) {
          finalLoyaltyMultiplier = promo.rewards.pointsMultiplier;
          isEligible = true;
        }
      }

      if (isEligible) {
        promoDiscountAmount += promoDiscountAdded;
        appliedPromos.push({
          promotionId: promo._id.toString(),
          name: promo.name,
          type: promo.type,
          discountAmount: promoDiscountAdded,
          loyaltyMultiplier: promo.rewards.pointsMultiplier || 1.0,
        });
      }
    }

    // Evaluate Coupon separately if provided
    let verifiedCoupon: ICoupon | undefined;
    if (couponCode && userId) {
      try {
        const mockCartSimplified = cartItems.map((item) => ({
          productId: item.productId,
          lineTotal: remainingLineTotals.get(`${item.productId}-${item.variantSku}`) || 0,
        }));
        const eligibleSubtotal = mockCartSimplified.reduce((sum, item) => sum + item.lineTotal, 0);

        verifiedCoupon = await this.validateCoupon(couponCode, userId, eligibleSubtotal, mockCartSimplified, productMap);

        const applicableSubtotal = await this.calculateApplicableSubtotal(verifiedCoupon, mockCartSimplified, eligibleSubtotal, productMap);

        if (verifiedCoupon.discountType === 'PERCENTAGE') {
          couponDiscountAmount = Number((applicableSubtotal * (verifiedCoupon.discountValue / 100)).toFixed(2));
        } else if (verifiedCoupon.discountType === 'FIXED_AMOUNT') {
          couponDiscountAmount = Math.min(verifiedCoupon.discountValue, applicableSubtotal);
        }

        if (verifiedCoupon.maximumDiscount) {
          couponDiscountAmount = Math.min(couponDiscountAmount, verifiedCoupon.maximumDiscount);
        }
      } catch (err: unknown) {
        log.warn(`Coupon validation failed during recalculation: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const totalDiscountApplied = Number((promoDiscountAmount + couponDiscountAmount).toFixed(2));

    return {
      promoDiscountAmount: Number(promoDiscountAmount.toFixed(2)),
      couponDiscountAmount: Number(couponDiscountAmount.toFixed(2)),
      eligiblePromotions: appliedPromos,
      subtotalWithDiscounts: Number(Math.max(0, subtotal - totalDiscountApplied).toFixed(2)),
      appliedCouponCode: verifiedCoupon ? verifiedCoupon.code : undefined,
      loyaltyMultiplier: finalLoyaltyMultiplier,
    };
  }

  /**
   * Safe helper for filtering items based on dynamic categories (Synchronous)
   */
  private filterItemsByCategoriesSync(
    items: { productId: string }[],
    categoryIds: mongoose.Types.ObjectId[],
    productMap: Map<string, unknown>
  ): unknown[] {
    const categoryStrings = categoryIds.map((id) => id.toString());
    return items.filter((item) => {
      const p = productMap.get(item.productId) as { category?: mongoose.Types.ObjectId };
      return p && categoryStrings.includes(p.category?.toString() || '');
    }).map(item => productMap.get(item.productId));
  }

  /**
   * Safe helper for filtering items based on dynamic categories
   */
  private async filterItemsByCategories(
    items: { productId: string }[],
    categoryIds: mongoose.Types.ObjectId[]
  ): Promise<unknown[]> {
    const productsInCategories = await Product.find({
      _id: { $in: items.map((i) => i.productId) },
      category: { $in: categoryIds },
    });
    return productsInCategories;
  }

  /**
   * Calculates subtotal of items eligible for a coupon code (takes vendor scope into account)
   */
  private async calculateApplicableSubtotal(
    coupon: ICoupon,
    items: { productId: string; lineTotal: number }[],
    currentSubtotal: number,
    productMap?: Map<string, unknown>
  ): Promise<number> {
    if (coupon.vendorScope === 'GLOBAL') {
      return currentSubtotal;
    }

    if (coupon.vendorScope === 'VENDOR' && coupon.vendorId) {
      if (productMap) {
        const allowedProductIds = items
          .map((i) => productMap.get(i.productId) as { _id: mongoose.Types.ObjectId, ownershipType?: string, vendorId?: mongoose.Types.ObjectId })
          .filter((p) => p && p.ownershipType === 'VENDOR' && p.vendorId?.toString() === coupon.vendorId?.toString())
          .map((p) => p._id.toString());
        
        return items
          .filter((i) => allowedProductIds.includes(i.productId))
          .reduce((sum, item) => sum + item.lineTotal, 0);
      } else {
        // Fallback for non-optimized paths
        const products = await Product.find({
          _id: { $in: items.map((i) => i.productId) },
          ownershipType: 'VENDOR',
          vendorId: coupon.vendorId,
        });

        const allowedProductIds = products.map((p) => p._id.toString());
        return items
          .filter((i) => allowedProductIds.includes(i.productId))
          .reduce((sum, item) => sum + item.lineTotal, 0);
      }
    }

    return 0;
  }
}

export const promotionEngineService = new PromotionEngineService();
