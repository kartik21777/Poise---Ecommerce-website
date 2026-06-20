import { Product, IProduct, IProductVariant } from '../models/Product.js';
import { RegionalPrice, IRegionalPrice } from '../models/RegionalPrice.js';
import { exchangeRateService } from './ExchangeRateService.js';
import mongoose from 'mongoose';

export interface PriceResolutionResult {
  finalPrice: number;
  currency: string;
  pricingSource: 'REGIONAL_OVERRIDE' | 'BASE_CONVERSION' | 'VARIANT_OVERRIDE_CONVERSION';
  regionalRuleUsed?: string;
  compareAtPrice?: number;
}

export class PriceResolutionService {
  /**
   * Universal resolver for a product / variant price in a requested currency & region scope.
   */
  async resolveProductPrice(
    productId: string | mongoose.Types.ObjectId,
    variantSku?: string,
    targetCurrency: string = 'USD',
    countryCode?: string
  ): Promise<PriceResolutionResult> {
    const currency = targetCurrency.toUpperCase();
    const pid = typeof productId === 'string' ? new mongoose.Types.ObjectId(productId) : productId;

    // 1. Double check for Regional Overrides (High Precedence)
    // Query with SKU specificity first, then product general if SKU specified
    let override: IRegionalPrice | null = null;
    
    if (variantSku) {
      override = await RegionalPrice.findOne({
        product: pid,
        variantSku,
        currencyCode: currency,
        isEnabled: true,
        ...(countryCode ? { countryCode: countryCode.toUpperCase() } : {}),
      });
    }

    if (!override) {
      override = await RegionalPrice.findOne({
        product: pid,
        variantSku: { $in: [null, ''] },
        currencyCode: currency,
        isEnabled: true,
        ...(countryCode ? { countryCode: countryCode.toUpperCase() } : {}),
      });
    }

    // If an override is found, return it directly!
    if (override) {
      return {
        finalPrice: override.price,
        currency,
        pricingSource: 'REGIONAL_OVERRIDE',
        regionalRuleUsed: override._id.toString(),
        compareAtPrice: override.compareAtPrice,
      };
    }

    // 2. Fallback: Base conversion calculation
    // Fetch product to retrieve original base metadata
    const product = await Product.findById(pid);
    if (!product) {
      throw new Error(`Catalog Error: Target product ${pid} not found for resolution.`);
    }

    let basePrice = product.price;
    let baseCompareAt = product.compareAtPrice;
    let isVariantVal = false;

    // If a variant SKU is provided, let's find the matching variant base override
    if (variantSku) {
      const match = product.variants.find((v) => v.sku === variantSku);
      if (match) {
        if (match.priceOverride !== undefined && match.priceOverride !== null) {
          basePrice = match.priceOverride;
          isVariantVal = true;
        }
      }
    }

    // Convert the base price using exchange rates
    const conversion = await exchangeRateService.convertAmount(basePrice, 'USD', currency);
    
    let resolvedCompareAt: number | undefined;
    if (baseCompareAt) {
      const cmpConversion = await exchangeRateService.convertAmount(baseCompareAt, 'USD', currency);
      resolvedCompareAt = cmpConversion.convertedAmount;
    }

    return {
      finalPrice: conversion.convertedAmount,
      currency,
      pricingSource: isVariantVal ? 'VARIANT_OVERRIDE_CONVERSION' : 'BASE_CONVERSION',
      compareAtPrice: resolvedCompareAt,
    };
  }

  /**
   * Helper utility to quickly resolve a list of products in the catalog page
   */
  async resolveProductCatalogPrices(
    products: IProduct[],
    targetCurrency: string = 'USD',
    countryCode?: string
  ): Promise<any[]> {
    return Promise.all(
      products.map(async (p) => {
        const resolved = await this.resolveProductPrice(p._id, undefined, targetCurrency, countryCode);
        const variantsWithPrices = await Promise.all(
          p.variants.map(async (v) => {
            const vResolved = await this.resolveProductPrice(p._id, v.sku, targetCurrency, countryCode);
            const vObj = typeof (v as any).toObject === 'function' ? (v as any).toObject() : JSON.parse(JSON.stringify(v));
            return {
              ...vObj,
              price: vResolved.finalPrice,
              compareAtPrice: vResolved.compareAtPrice,
            };
          })
        );

        return {
          ...p.toObject(),
          price: resolved.finalPrice,
          compareAtPrice: resolved.compareAtPrice,
          resolvedCurrency: targetCurrency,
          variants: variantsWithPrices,
        };
      })
    );
  }
}

export const priceResolutionService = new PriceResolutionService();
