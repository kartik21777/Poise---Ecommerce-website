import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Cart } from '../models/Cart.js';
import { Address } from '../models/Address.js';
import { Order, OrderStatus, PaymentStatus } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { recalculateCartService } from '../services/cartRecalculationService.js';
import { toOrderDto } from '../dtos/orderDto.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';
import { taxProviderRegistry } from '../services/TaxProvider.js';
import { exchangeRateService } from '../services/ExchangeRateService.js';
import { giftCardCreditService } from '../services/GiftCardCreditService.js';
import { promotionEngineService } from '../services/PromotionEngineService.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Coupon } from '../models/Coupon.js';

const calculateDynamicCharges = async (
  subtotal: number,
  currency: string,
  country: string,
  items: { sku: string; quantity: number; subtotalPrice: number }[]
) => {
  const reqCurrency = currency.toUpperCase();
  const reqCountry = country.toUpperCase();

  // Convert standard USD thresholds to checkout currency at modern rate
  const { convertedAmount: thresholdConverted } = await exchangeRateService.convertAmount(150, 'USD', reqCurrency);
  const { convertedAmount: shippingFeeConverted } = await exchangeRateService.convertAmount(10, 'USD', reqCurrency);

  const shipping = subtotal >= thresholdConverted || subtotal === 0 ? 0 : shippingFeeConverted;

  const provider = taxProviderRegistry.getProvider(reqCountry);
  const taxCalc = await provider.calculateTax({
    items,
    shippingAddress: { country: reqCountry, city: '', state: '', postalCode: '', addressLine1: '', fullName: '', phone: '' },
    currency: reqCurrency,
    totalSubtotal: subtotal,
  });

  const tax = Number(taxCalc.totalTaxAmount.toFixed(4));
  const total = Number((subtotal + shipping + tax).toFixed(4));

  return { shipping, tax, taxSnapshot: taxCalc, total };
};

/**
 * atomic stock deduction with saga rollback in case of partial failures
 */
export const deductStockAtomically = async (items: { sku: string; quantity: number }[]) => {
  const successfullyDeducted: { sku: string; quantity: number }[] = [];

  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      {
        'variants.sku': item.sku,
        'variants.stock': { $gte: item.quantity },
      },
      {
        $inc: { 'variants.$.stock': -item.quantity },
      },
      { new: true }
    );

    if (!updated) {
      // Rollback successfully deducted stock
      for (const rolledBackItem of successfullyDeducted) {
        await Product.findOneAndUpdate(
          { 'variants.sku': rolledBackItem.sku },
          { $inc: { 'variants.$.stock': rolledBackItem.quantity } }
        );
      }
      throw new AppError(400, `Insufficient stock for product variant SKU: ${item.sku}`);
    }

    successfullyDeducted.push(item);
  }
};

/**
 * Restore stock atomically
 */
export const restoreStockAtomically = async (items: { sku: string; quantity: number }[]) => {
  for (const item of items) {
    await Product.findOneAndUpdate(
      { 'variants.sku': item.sku },
      { $inc: { 'variants.$.stock': item.quantity } }
    );
  }
};

// 1. POST /api/checkout/preview
export const checkoutPreview = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const targetCurrency = (req.headers['x-currency'] as string) || (req.query.currency as string) || 'USD';
  const countryCode = (req.headers['x-country-code'] as string) || (req.query.country as string) || 'US';
  const { couponCode } = req.body;

  // 1. Load cart and recalculate with currency variables
  const calcResult = await recalculateCartService(userId, targetCurrency, countryCode);

  // 2. Evaluate promotional discounts and coupon reductions
  const formattedItemsForPromo = calcResult.validItems.map((item) => ({
    productId: item.productId,
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));

  const discounts = await promotionEngineService.evaluateDiscounts(userId, formattedItemsForPromo, couponCode);

  // 3. Compute dynamic regional shipping, tax, total based on discounted subtotal
  const { shipping, tax, total, taxSnapshot } = await calculateDynamicCharges(
    discounts.subtotalWithDiscounts,
    targetCurrency,
    countryCode,
    calcResult.validItems.map((item) => ({
      sku: item.variantSku,
      quantity: item.quantity,
      subtotalPrice: item.lineTotal, // original price or we can apply proportional reduction if tax has line-level rules, but we'll feed original
    }))
  );

  // 4. Form warnings
  const warnings: string[] = [];
  if (calcResult.hasPriceChanges) {
    warnings.push('Some product prices in your cart have changed to reflect current catalog status.');
  }
  if (calcResult.unavailableVariants.length > 0) {
    calcResult.unavailableVariants.forEach(v => {
      warnings.push(`Item "${v.requestedName}" (${v.sku}) is unavailable: ${v.reason}`);
    });
  }

  res.json({
    subtotal: calcResult.newSubtotal,
    discountedSubtotal: discounts.subtotalWithDiscounts,
    promoDiscountAmount: discounts.promoDiscountAmount,
    couponDiscountAmount: discounts.couponDiscountAmount,
    appliedCouponCode: discounts.appliedCouponCode,
    appliedPromotionSnaps: discounts.eligiblePromotions,
    loyaltyMultiplier: discounts.loyaltyMultiplier,
    currency: targetCurrency.toUpperCase(),
    shipping,
    tax,
    total,
    taxSnapshot,
    warnings,
  });
});

// 2. POST /api/orders (Create Order)
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { shippingAddressId, currency: requestedCurrency, couponCode, giftCardCodes, useStoreCredit, pointsToRedeem } = req.body;

  if (!shippingAddressId) {
    throw new AppError(400, 'shippingAddressId is required');
  }

  // Find address
  const address = await Address.findOne({ _id: shippingAddressId, user: userId });
  if (!address) {
    throw new AppError(400, 'Invalid shipping address selected');
  }

  const shippingCountry = address.country || 'US';
  const targetCurrency = (requestedCurrency || (req.headers['x-currency'] as string) || 'USD').toUpperCase();

  // Load and recalculate cart with locked session currency context
  const calcResult = await recalculateCartService(userId, targetCurrency, shippingCountry);

  if (calcResult.validItems.length === 0) {
    throw new AppError(400, 'Cannot place an order with an empty cart or fully out-of-stock items.');
  }

  if (calcResult.unavailableVariants.length > 0) {
    throw new AppError(400, 'Your cart contains out-of-stock or deleted items. Please update your cart before placing the order.');
  }

  // Find actual metadata (names, slugs, images) from Product documents to create immutable snapshots
  const productIds = calcResult.validItems.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });

  const orderItemsSnapshot = calcResult.validItems.map(item => {
    const productDoc = products.find(p => p._id.toString() === item.productId);
    if (!productDoc) {
      throw new AppError(400, `Product metadata not found for ID: ${item.productId}`);
    }

    const varDetails = productDoc.variants?.find(v => v.sku === item.variantSku);
    const attributes = varDetails?.attributes?.map(a => ({ name: a.name || '', value: a.value || '' })) || [];
    
    // Fallback if structured attributes are empty but size/color values exist on variant
    if (attributes.length === 0) {
      if (varDetails?.size) attributes.push({ name: 'Size', value: varDetails.size });
      if (varDetails?.color) attributes.push({ name: 'Color', value: varDetails.color });
    }

    // Resolve image
    let itemImage = '';
    if (varDetails?.images && varDetails.images.length > 0) {
      itemImage = varDetails.images[0].secure_url;
    } else if (productDoc.images && productDoc.images.length > 0) {
      itemImage = productDoc.images[0].secure_url;
    }

    return {
      productId: new mongoose.Types.ObjectId(item.productId),
      productName: productDoc.name,
      productSlug: productDoc.slug,
      image: itemImage,
      sku: item.variantSku,
      attributes,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    };
  });

  // Evaluate promotional discounts and coupon reductions
  const formattedItemsForPromo = calcResult.validItems.map((item) => ({
    productId: item.productId,
    variantSku: item.variantSku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));

  const discounts = await promotionEngineService.evaluateDiscounts(userId, formattedItemsForPromo, couponCode);

  // Calculate dynamic shipping, taxes and currency snapshots based on discounted subtotal
  const { shipping, tax, taxSnapshot, total } = await calculateDynamicCharges(
    discounts.subtotalWithDiscounts,
    targetCurrency,
    shippingCountry,
    calcResult.validItems.map((item) => ({
      sku: item.variantSku,
      quantity: item.quantity,
      subtotalPrice: item.lineTotal,
    }))
  );

  // Retrieve immutable reference version of and multipliers of exchange rate for audit
  const activeRateVersion = await exchangeRateService.getLatestRates();
  const rateMatch = activeRateVersion.rates.find(r => r.targetCurrency === targetCurrency);
  const activeRateMultiplier = rateMatch ? rateMatch.rate : 1.0;

  // Generate Unique Order Number
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  const orderNumber = `ORD-${Date.now()}-${randomSuffix}`;

  // Calculate Gift Card and Store Credit Allocations before Order persistence (Section 3.6 & 4.5)
  const allocations = await giftCardCreditService.determineAllocations({
    userId,
    totalAmount: total,
    currency: targetCurrency,
    giftCardCodes: giftCardCodes || [],
    useStoreCredit: !!useStoreCredit,
    pointsToRedeem: pointsToRedeem ? Number(pointsToRedeem) : 0,
  });

  // Assemble Order with snapshotted coupon/promo state
  const order = new Order({
    user: userId,
    orderNumber,
    items: orderItemsSnapshot,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    },
    subtotal: calcResult.newSubtotal,
    shipping,
    tax,
    total,
    status: (allocations.gatewayAmountAllocated <= 0 ? 'PAID' : 'PENDING') as OrderStatus,
    paymentStatus: (allocations.gatewayAmountAllocated <= 0 ? 'PAID' : 'UNPAID') as PaymentStatus,
    currency: targetCurrency,
    exchangeRateVersion: activeRateVersion._id,
    exchangeRateUsed: activeRateMultiplier,
    regionalPricingSource: calcResult.validItems[0]?.pricingSource || 'BASE_CONVERSION',
    taxSnapshot,
    giftCardAllocations: allocations.giftCardAllocations.map(alloc => ({
      giftCardId: new mongoose.Types.ObjectId(alloc.giftCardId),
      code: alloc.code,
      amount: alloc.allocatedAmountInOrderCurrency,
      amountInCardCurrency: alloc.allocatedAmountInCardCurrency,
    })),
    storeCreditUsed: allocations.storeCreditAllocated,
    gatewayAmountUsed: allocations.gatewayAmountAllocated,
    loyaltyPointsUsed: allocations.loyaltyPointsAllocated || 0,
    loyaltyAmountUsed: allocations.loyaltyAmountAllocated || 0,
    couponCode: discounts.appliedCouponCode,
    promoDiscountAmount: Number((calcResult.newSubtotal - discounts.subtotalWithDiscounts).toFixed(2)),
    appliedPromotionSnaps: discounts.eligiblePromotions.map(p => ({
      promotionId: new mongoose.Types.ObjectId(p.promotionId),
      name: p.name,
      type: p.type,
      discountAmount: p.discountAmount,
      loyaltyMultiplier: p.loyaltyMultiplier,
    })),
  });

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await order.save({ session });

    // Record Coupon Redemption Ledger
    if (discounts.couponDiscountAmount > 0 && discounts.appliedCouponCode) {
      const updatedCoupon = await Coupon.findOneAndUpdate(
        {
          code: discounts.appliedCouponCode,
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { $expr: { $lt: ['$usageCount', '$usageLimit'] } }
          ]
        },
        { $inc: { usageCount: 1 } },
        { new: true, session }
      );

      if (!updatedCoupon) {
        throw new AppError(400, 'Coupon usage limit reached during processing.');
      }

      await CouponRedemption.create([{
        couponId: updatedCoupon._id,
        couponCode: updatedCoupon.code,
        userId: new mongoose.Types.ObjectId(userId),
        orderId: order._id,
        discountAmount: discounts.couponDiscountAmount,
        vendorScope: updatedCoupon.vendorScope,
        vendorId: updatedCoupon.vendorId,
      }], { session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  // Debit the active ledger books for applied items
  if (
    allocations.giftCardAllocations.length > 0 ||
    allocations.storeCreditAllocated > 0 ||
    (allocations.loyaltyPointsAllocated && allocations.loyaltyPointsAllocated > 0)
  ) {
    await giftCardCreditService.executeCheckoutLedgers({
      userId,
      orderId: order._id.toString(),
      allocations,
      notes: `Order Checkout Payment: ${orderNumber}`
    });
  }

  // Earn Loyalty points immediately if paid (Section 1.5 & 10)
  if (order.status === 'PAID') {
    try {
      const { loyaltyEarnService } = await import('../services/LoyaltyEarnService.js');
      const { loyaltyReferralService } = await import('../services/LoyaltyReferralService.js');
      
      await loyaltyEarnService.earnPointsForOrder({
        userId,
        orderId: order._id.toString(),
        orderTotalInOrderCurrency: order.total,
        currency: order.currency,
      });

      await loyaltyReferralService.rewardOnPurchase(order._id.toString(), userId);
    } catch (err: unknown) {
      console.error('Failed to disburse checkout loyalty rewards on PAID order:', err instanceof Error ? err.message : String(err));
    }
  }

  // Clear user's active cart upon order placement
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } });

  res.status(201).json(toOrderDto(order));
});

// 3. GET /api/orders (User order list)
export const getMyOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
  res.json(orders.map(toOrderDto));
});

// 4. GET /api/orders/:id (User order details)
export const getMyOrderDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const order = await Order.findOne({ _id: id, user: userId });
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  res.json(toOrderDto(order));
});

// 5. GET /api/admin/orders (Admin list views)
export const getAdminOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'name email');
  res.json(orders.map(o => {
    const response = toOrderDto(o);
    // Include minimal user context for admin convenience
    (response as unknown as Record<string, unknown>).userContext = {
      name: ((o.user as unknown) as Record<string, unknown>)?.name || 'Guest User',
      email: ((o.user as unknown) as Record<string, unknown>)?.email || 'N/A'
    };
    return response;
  }));
});

// 6. PUT /api/admin/orders/:id/status (Admin change order status)
export const updateOrderStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  let stateUpdated = false;

  // Validate state transitions if transitioning OrderStatus
  if (status && status !== order.status) {
    const fromStatus = order.status;
    const toStatus = status as OrderStatus;

    // Terminal check
    if (fromStatus === 'CANCELLED' || fromStatus === 'REFUNDED' || fromStatus === 'DELIVERED') {
      throw new AppError(400, `Cannot transit order from terminal state: ${fromStatus}`);
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ['PAYMENT_PENDING', 'PAID', 'CANCELLED'],
      PAYMENT_PENDING: ['PAID', 'CANCELLED'],
      PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
      PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!validTransitions[fromStatus]?.includes(toStatus)) {
      throw new AppError(400, `Illegal order status transition from ${fromStatus} to ${toStatus}`);
    }

    // Compensation logic if order is cancelled or refunded
    if (toStatus === 'CANCELLED' || toStatus === 'REFUNDED') {
      if (order.inventoryDeducted) {
        const itemsToRestore = order.items.map(item => ({ sku: item.sku, quantity: item.quantity }));
        await restoreStockAtomically(itemsToRestore);
        order.inventoryDeducted = false;
      }
      
      // Coupon Rollback Support
      if (order.couponCode) {
        const redemption = await CouponRedemption.findOneAndDelete({ orderId: order._id });
        if (redemption) {
          await Coupon.findByIdAndUpdate(redemption.couponId, { $inc: { usageCount: -1 } });
        }
      }

      // Auto transition payment status as appropriate
      if (toStatus === 'CANCELLED' && order.paymentStatus === 'UNPAID') {
        order.paymentStatus = 'FAILED';
      } else if (toStatus === 'REFUNDED') {
        order.paymentStatus = 'REFUNDED';
      }
    }

    // Auto transition order status on PAID
    if (toStatus === 'PAID') {
      order.paymentStatus = 'PAID';
    }

    order.status = toStatus;
    stateUpdated = true;
  }

  // Allow separate update to PaymentStatus if provided
  if (paymentStatus && paymentStatus !== order.paymentStatus) {
    const nextPayStatus = paymentStatus as PaymentStatus;
    
    // Auto sync OrderStatus if payment transitions from unpaid to paid
    if (nextPayStatus === 'PAID' && order.status === 'PENDING') {
      order.status = 'PAID';
    }
    if (nextPayStatus === 'REFUNDED' && order.status !== 'REFUNDED') {
      order.status = 'REFUNDED';
      if (order.inventoryDeducted) {
        const itemsToRestore = order.items.map(item => ({ sku: item.sku, quantity: item.quantity }));
        await restoreStockAtomically(itemsToRestore);
        order.inventoryDeducted = false;
      }

      // Coupon Rollback Support
      if (order.couponCode) {
        const redemption = await CouponRedemption.findOneAndDelete({ orderId: order._id });
        if (redemption) {
          await Coupon.findByIdAndUpdate(redemption.couponId, { $inc: { usageCount: -1 } });
        }
      }
    }

    order.paymentStatus = nextPayStatus;
    stateUpdated = true;
  }

  if (!stateUpdated) {
    throw new AppError(400, 'No valid fields provided for transition updates.');
  }

  await order.save();
  res.json(toOrderDto(order));
});
