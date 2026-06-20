import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Currency } from '../models/Currency.js';
import { ExchangeRateVersion } from '../models/ExchangeRateVersion.js';
import { RegionalPrice } from '../models/RegionalPrice.js';
import { exchangeRateService } from '../services/ExchangeRateService.js';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

// 1. GET /api/admin/commerce/currencies
export const getAdminCurrencies = asyncHandler(async (req: Request, res: Response) => {
  const currencies = await Currency.find({}).sort({ code: 1 });
  res.json(currencies);
});

// 2. POST /api/admin/commerce/currencies
export const createAdminCurrency = asyncHandler(async (req: Request, res: Response) => {
  const { code, symbol, decimalPrecision, isBase, isActive } = req.body;

  if (!code || !symbol) {
    throw new AppError(400, 'Code and symbol are required fields');
  }

  const normalizedCode = code.toUpperCase();

  // If setting as base, de-rank any other base currency
  if (isBase) {
    await Currency.updateMany({ isBase: true }, { $set: { isBase: false } });
  }

  const currency = await Currency.create({
    code: normalizedCode,
    symbol,
    decimalPrecision: decimalPrecision ?? 2,
    isBase: !!isBase,
    isEnabled: isActive !== false,
  });

  res.status(201).json(currency);
});

// 3. PUT /api/admin/commerce/currencies/:id
export const updateAdminCurrency = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { symbol, decimalPrecision, isBase, isActive } = req.body;

  const currency = await Currency.findById(id);
  if (!currency) {
    throw new AppError(404, 'Currency not found');
  }

  if (symbol !== undefined) currency.symbol = symbol;
  if (decimalPrecision !== undefined) currency.decimalPrecision = decimalPrecision;
  if (isActive !== undefined) currency.isEnabled = isActive;

  if (isBase) {
    await Currency.updateMany({ isBase: true }, { $set: { isBase: false } });
    currency.isBase = true;
    currency.isEnabled = true; // Base currency must be active
  }

  await currency.save();
  res.json(currency);
});

// 4. GET /api/admin/commerce/exchange-rates
export const getAdminExchangeRates = asyncHandler(async (req: Request, res: Response) => {
  const history = await ExchangeRateVersion.find({}).sort({ versionNumber: -1 }).limit(30);
  res.json(history);
});

// 5. POST /api/admin/commerce/exchange-rates
export const updateAdminExchangeRates = asyncHandler(async (req: Request, res: Response) => {
  const { rates } = req.body; // Array of { targetCurrency: string, rate: number }

  if (!Array.isArray(rates) || rates.length === 0) {
    throw new AppError(400, 'Rates must be a non-empty array of mappings');
  }

  const ratesRecord: Record<string, number> = {};
  rates.forEach((item: any) => {
    ratesRecord[item.targetCurrency] = item.rate;
  });

  const creatorUserId = (req as any).user?.id || 'SYSTEM_ADMIN';
  const newVersion = await exchangeRateService.updateAndPublishRates(ratesRecord, creatorUserId);

  res.status(201).json(newVersion);
});

// 6. GET /api/admin/commerce/regional-prices
export const getAdminRegionalPrices = asyncHandler(async (req: Request, res: Response) => {
  const prices = await RegionalPrice.find({})
    .sort({ countryCode: 1, currencyCode: 1 })
    .populate('product', 'name slug images price');
  res.json(prices);
});

// 7. POST /api/admin/commerce/regional-prices
export const createAdminRegionalPrice = asyncHandler(async (req: Request, res: Response) => {
  const { productId, variantSku, countryCode, currencyCode, priceOverride, compareAtPriceOverride, note } = req.body;

  if (!productId || !countryCode || !currencyCode || priceOverride === undefined) {
    throw new AppError(400, 'productId, countryCode, currencyCode, and priceOverride are required fields');
  }

  const doc = await RegionalPrice.create({
    product: new mongoose.Types.ObjectId(productId),
    variantSku: variantSku || null,
    countryCode: countryCode.toUpperCase(),
    currencyCode: currencyCode.toUpperCase(),
    price: Number(priceOverride),
    compareAtPrice: compareAtPriceOverride ? Number(compareAtPriceOverride) : undefined,
    isEnabled: true,
  });

  res.status(201).json(doc);
});

// 8. DELETE /api/admin/commerce/regional-prices/:id
export const deleteAdminRegionalPrice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RegionalPrice.findByIdAndDelete(id);
  
  if (!result) {
    throw new AppError(404, 'Regional price override not found');
  }

  res.json({ success: true, message: 'Regional pricing override deleted successfully' });
});
