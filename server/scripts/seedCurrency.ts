/**
 * seedCurrency.ts
 * Seeds the INR currency as the base currency and registers
 * India (IN) as the primary supported country in the commerce engine.
 *
 * This runs automatically on every server start if INR is not already present.
 */
import { Currency } from '../models/Currency.js';
import { ExchangeRateVersion } from '../models/ExchangeRateVersion.js';

export const seedCurrency = async () => {
  // ── 1. Ensure INR exists and is the base currency ──────────────────────────
  const existingInr = await Currency.findOne({ code: 'INR' });

  if (!existingInr) {
    // De-rank any existing base currency first
    await Currency.updateMany({ isBase: true }, { $set: { isBase: false } });

    await Currency.create({
      code: 'INR',
      symbol: '₹',
      decimalPrecision: 0, // INR is typically shown without paise
      isBase: true,
      isEnabled: true,
    });

    console.log('[seedCurrency] INR currency created and set as base.');
  } else if (!existingInr.isBase) {
    // INR exists but isn't base — promote it
    await Currency.updateMany({ isBase: true }, { $set: { isBase: false } });
    existingInr.isBase = true;
    existingInr.isEnabled = true;
    await existingInr.save();
    console.log('[seedCurrency] INR promoted to base currency.');
  } else {
    console.log('[seedCurrency] INR already configured as base currency. Skipping.');
    return;
  }

  // ── 2. Ensure USD also exists (as a non-base reference currency) ──────────
  const existingUsd = await Currency.findOne({ code: 'USD' });
  if (!existingUsd) {
    await Currency.create({
      code: 'USD',
      symbol: '$',
      decimalPrecision: 2,
      isBase: false,
      isEnabled: true,
    });
    console.log('[seedCurrency] USD reference currency created.');
  }

  // ── 3. Publish a USD→INR exchange rate version ────────────────────────────
  // Rate: 1 USD = 84 INR (approximate market rate, June 2025)
  const latestVersion = await ExchangeRateVersion.findOne().sort({ versionNumber: -1 });
  const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

  await ExchangeRateVersion.create({
    versionNumber: nextVersion,
    rates: [{ targetCurrency: 'USD', rate: 0.011905 }], // INR→USD (1/84)
    creatorUserId: 'SYSTEM_SEED',
    isActive: true,
  });

  console.log('[seedCurrency] USD ↔ INR exchange rate published (1 USD = ₹84).');
};
