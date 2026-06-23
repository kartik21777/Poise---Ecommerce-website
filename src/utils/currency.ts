/**
 * Currency configuration for Poise.
 * The product catalog is stored in USD internally.
 * All prices shown to users are displayed in INR (₹).
 * Conversion: 1 USD = 84 INR (approximate market rate).
 */

export const STORE_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
  usdToInr: 84,
};

/**
 * Convert a USD value to INR and format it for display.
 * Uses Indian number formatting (e.g. ₹1,68,000).
 *
 * @param usdAmount - The amount in USD (as stored in the database)
 * @param decimals  - Number of decimal places (default 0 — INR is typically shown without paise)
 */
export function formatPrice(usdAmount: number, decimals: number = 0): string {
  const inr = usdAmount * STORE_CURRENCY.usdToInr;
  return new Intl.NumberFormat(STORE_CURRENCY.locale, {
    style: 'currency',
    currency: STORE_CURRENCY.code,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(inr);
}

/**
 * Convert USD to raw INR number (for calculations).
 */
export function usdToInr(usdAmount: number): number {
  return Math.round(usdAmount * STORE_CURRENCY.usdToInr);
}
