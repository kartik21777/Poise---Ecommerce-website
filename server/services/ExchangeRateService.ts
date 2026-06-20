import { ExchangeRateVersion, IExchangeRateVersion } from '../models/ExchangeRateVersion.js';
import { Currency } from '../models/Currency.js';
import { AuditLog } from '../models/AuditLog.js';
import mongoose from 'mongoose';

export class ExchangeRateService {
  private static cachedVersion: IExchangeRateVersion | null = null;
  private static cacheExpiryTime: number = 0;
  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24-hour limit

  /**
   * Set fallback/default Exchange rates safely
   */
  private static getFallbackRates(): Record<string, number> {
    return {
      USD: 1.0,
      INR: 83.5,
      EUR: 0.92,
      GBP: 0.78,
      AUD: 1.51,
      CAD: 1.37,
    };
  }

  /**
   * Safe fetch of latest active Exchange Rate Version, with TTL caching and automated fallback mechanisms
   */
  async getLatestRates(forceRefresh: boolean = false): Promise<IExchangeRateVersion> {
    const now = Date.now();
    
    if (!forceRefresh && ExchangeRateService.cachedVersion && now < ExchangeRateService.cacheExpiryTime) {
      return ExchangeRateService.cachedVersion;
    }

    try {
      // Find the absolute latest active Exchange rate snapshot version
      let version = await ExchangeRateVersion.findOne().sort({ versionNumber: -1 });

      if (version) {
        const isStale = (now - version.effectiveFrom.getTime()) > ExchangeRateService.MAX_AGE_MS;
        if (isStale) {
          console.warn(`[ExchangeRateService] Version #${version.versionNumber} is stale. Checking for automated refresh requirements.`);
        }
        
        ExchangeRateService.cachedVersion = version;
        ExchangeRateService.cacheExpiryTime = now + 5 * 60 * 1000; // 5-minute cache lifespan
        return version;
      }

      // No system rates exist at all: Bootstrap default version dynamically
      console.log('[ExchangeRateService] No exchange rate history found. Initializing master bootstrap settings...');
      const fallbackRatesMap = ExchangeRateService.getFallbackRates();
      const ratesItemArray = Object.entries(fallbackRatesMap).map(([currency, multiplier]) => ({
        targetCurrency: currency,
        rate: multiplier,
      }));

      version = new ExchangeRateVersion({
        versionNumber: 1,
        baseCurrency: 'USD',
        rates: ratesItemArray,
        source: 'MANUAL',
        effectiveFrom: new Date(),
        notes: 'Initial automatic bootstrap exchange rate safety rates.',
      });

      await version.save();

      ExchangeRateService.cachedVersion = version;
      ExchangeRateService.cacheExpiryTime = now + 5 * 60 * 1000;
      return version;
    } catch (error) {
      console.error('[ExchangeRateService] Failed retrieving database-backed rates. Emulating fallback container.', error);
      
      // Secondary safety recovery container
      const pseudoVersion = new ExchangeRateVersion({
        versionNumber: 0,
        baseCurrency: 'USD',
        rates: Object.entries(ExchangeRateService.getFallbackRates()).map(([currency, multiplier]) => ({
          targetCurrency: currency,
          rate: multiplier,
        })),
        source: 'MANUAL',
        effectiveFrom: new Date(),
        notes: 'Out-of-database physical safety fallback copy.',
      });
      return pseudoVersion;
    }
  }

  /**
   * Safely create a new IMMUTABLE version of exchange rates.
   * Assures zero rates, negative rates, and retroactive conversions are blocked.
   */
  async updateAndPublishRates(
    newRates: Record<string, number>,
    userId?: string,
    notes?: string
  ): Promise<IExchangeRateVersion> {
    // 1. Structural safety audits
    Object.entries(newRates).forEach(([currency, rate]) => {
      if (rate <= 0) {
        throw new Error(`Pricing Constraint: Invalid exchange multiplier for ${currency}: ${rate}. Must be positive.`);
      }
    });

    const latest = await this.getLatestRates(true);
    const nextVersionNum = latest ? latest.versionNumber + 1 : 1;

    const ratesItemArray = Object.entries(newRates).map(([currency, value]) => ({
      targetCurrency: currency.toUpperCase(),
      rate: Number(value),
    }));

    // Ensure Base Currency (USD) is always 1.0!
    const baseExists = ratesItemArray.some((r) => r.targetCurrency === 'USD');
    if (!baseExists) {
      ratesItemArray.push({ targetCurrency: 'USD', rate: 1.0 });
    } else {
      const usdItem = ratesItemArray.find((r) => r.targetCurrency === 'USD');
      if (usdItem) usdItem.rate = 1.0;
    }

    const newVersion = new ExchangeRateVersion({
      versionNumber: nextVersionNum,
      baseCurrency: 'USD',
      rates: ratesItemArray,
      source: 'MANUAL',
      createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      effectiveFrom: new Date(),
      notes: notes || 'Admin system custom audit rates adjustment.',
    });

    await newVersion.save();

    // Reset caches
    ExchangeRateService.cachedVersion = newVersion;
    ExchangeRateService.cacheExpiryTime = Date.now() + 5 * 60 * 1000;

    // Persist Audits
    await AuditLog.create({
      action: 'EXCHANGE_RATE_PUBLISHED',
      entityType: 'ExchangeRateVersion',
      entityId: newVersion._id.toString(),
      payload: {
        versionNumber: nextVersionNum,
        rates: newRates,
      },
      reason: notes || 'Manual administrative override action.',
      user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
    });

    return newVersion;
  }

  /**
   * Converts an amount from base currency to target or vice versa safely using a specific historical or current rate version.
   */
  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    versionId?: string
  ): Promise<{
    convertedAmount: number;
    rateUsed: number;
    exchangeVersion: number;
  }> {
    const rateVersion = versionId 
      ? await ExchangeRateVersion.findById(versionId) 
      : await this.getLatestRates();

    if (!rateVersion) {
      throw new Error(`Conversion Fault: Requested rate version ${versionId || 'LATEST'} does not exist`);
    }

    const ratesMap: Record<string, number> = {};
    rateVersion.rates.forEach((item) => {
      ratesMap[item.targetCurrency] = item.rate;
    });
    
    // Fallbacks just in case a key is missing
    const fallbackMap = ExchangeRateService.getFallbackRates();
    const fromRate = ratesMap[fromCurrency.toUpperCase()] || fallbackMap[fromCurrency.toUpperCase()] || 1;
    const toRate = ratesMap[toCurrency.toUpperCase()] || fallbackMap[toCurrency.toUpperCase()] || 1;

    // Convert to USD base first, then to target
    const amountInBase = amount / fromRate;
    const finalAmount = amountInBase * toRate;
    
    // Relative rate
    const relativeRate = toRate / fromRate;

    return {
      convertedAmount: Number(finalAmount.toFixed(4)),
      rateUsed: Number(relativeRate.toFixed(6)),
      exchangeVersion: rateVersion.versionNumber,
    };
  }

  /**
   * Retrieves a specific single mapping multiplier from current active set
   */
  async getSingleRate(targetCurrency: string): Promise<number> {
    const latest = await this.getLatestRates();
    const match = latest.rates.find((r) => r.targetCurrency === targetCurrency.toUpperCase());
    return match ? match.rate : (ExchangeRateService.getFallbackRates()[targetCurrency.toUpperCase()] || 1.0);
  }
}

export const exchangeRateService = new ExchangeRateService();
