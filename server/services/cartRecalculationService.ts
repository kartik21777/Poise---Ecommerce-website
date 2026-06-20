import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { priceResolutionService } from './PriceResolutionService.js';
import { exchangeRateService } from './ExchangeRateService.js';

export interface CartCalculationResult {
  cartId: string;
  currency: string;
  exchangeRateVersionNumber: number;
  originalSubtotal: number;
  newSubtotal: number;
  hasPriceChanges: boolean;
  unavailableVariants: { sku: string; requestedName: string; reason: string }[];
  priceChanges: { sku: string; oldPrice: number; newPrice: number }[];
  validItems: {
    productId: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    pricingSource: string;
    regionalRuleUsed?: string;
  }[];
}

/**
 * Enterprise Cart Recalculator Service supporting Multi-currency & Regional Price overrides.
 * Re-shards prices dynamically for the requested currency while maintaining single-currency cart constraints.
 */
export const recalculateCartService = async (
  userId: string,
  targetCurrency: string = 'USD',
  countryCode?: string
): Promise<CartCalculationResult> => {
  const reqCurrency = targetCurrency.toUpperCase();
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  // Retrieve current active version of exchange rates to lock down the transaction session
  const latestRates = await exchangeRateService.getLatestRates();

  let originalSubtotal = 0;
  let newSubtotal = 0;
  let hasPriceChanges = false;
  
  const unavailableVariants: CartCalculationResult['unavailableVariants'] = [];
  const priceChanges: CartCalculationResult['priceChanges'] = [];
  const validItems: CartCalculationResult['validItems'] = [];

  for (const item of cart.items) {
    // 1. Calculate historical line cost (in current cart item unitPrice context)
    const oldPriceTotal = item.quantity * item.unitPrice;
    originalSubtotal += oldPriceTotal;

    const product = item.product as any; // populated product document

    if (!product || typeof product === 'string' || product.status !== 'active') {
      unavailableVariants.push({
        sku: item.variantSku,
        requestedName: product?.name || 'Unknown Product',
        reason: 'Product no longer active or exists in store index',
      });
      continue;
    }

    const variant = product.variants?.find((v: any) => v.sku === item.variantSku);
    if (!variant) {
      unavailableVariants.push({
        sku: item.variantSku,
        requestedName: product.name,
        reason: 'Variant sku no longer active',
      });
      continue;
    }

    if (variant.stock < item.quantity) {
      unavailableVariants.push({
        sku: item.variantSku,
        requestedName: product.name,
        reason: `Only ${variant.stock} left in stock`,
      });
      continue;
    }

    // 2. Resolve final unit price for the target currency using the price resolution engine
    const priceResolution = await priceResolutionService.resolveProductPrice(
      product._id,
      item.variantSku,
      reqCurrency,
      countryCode
    );

    const resolvedUnitPrice = priceResolution.finalPrice;
    const newLineTotal = resolvedUnitPrice * item.quantity;
    newSubtotal += newLineTotal;

    // Detect pricing deviations compared to the stored cart unit prices
    if (resolvedUnitPrice !== item.unitPrice) {
      hasPriceChanges = true;
      priceChanges.push({
        sku: item.variantSku,
        oldPrice: item.unitPrice,
        newPrice: resolvedUnitPrice,
      });
    }

    validItems.push({
      productId: product._id.toString(),
      variantSku: item.variantSku,
      quantity: item.quantity,
      unitPrice: resolvedUnitPrice,
      lineTotal: newLineTotal,
      pricingSource: priceResolution.pricingSource,
      regionalRuleUsed: priceResolution.regionalRuleUsed,
    });
  }

  return {
    cartId: cart._id.toString(),
    currency: reqCurrency,
    exchangeRateVersionNumber: latestRates.versionNumber,
    originalSubtotal,
    newSubtotal: Number(newSubtotal.toFixed(4)),
    hasPriceChanges,
    unavailableVariants,
    priceChanges,
    validItems,
  };
};
