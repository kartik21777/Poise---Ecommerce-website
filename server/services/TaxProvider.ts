import { IShippingAddressSnapshot } from '../models/Order.js';

export interface TaxCalculationParams {
  items: {
    sku: string;
    quantity: number;
    subtotalPrice: number;
    category?: string;
  }[];
  shippingAddress: IShippingAddressSnapshot;
  currency: string;
  totalSubtotal: number;
}

export interface TaxLineItem {
  taxName: 'GST' | 'VAT' | 'SALES_TAX' | 'UNKNOWN';
  rate: number; // e.g., 0.18 for 18%
  amount: number;
}

export interface TaxCalculationResult {
  totalTaxAmount: number;
  taxLines: TaxLineItem[];
  providerName: string;
}

/**
 * Enterprise TaxProvider abstraction contract.
 * Allows concrete tax plugins (Avalara, TaxJar, or custom country rate engines) to mount seamlessly downstream.
 */
export abstract class TaxProvider {
  abstract getProviderName(): string;
  abstract calculateTax(params: TaxCalculationParams): Promise<TaxCalculationResult>;
}

// Concrete simple implementation representing fallback tax baseline
export class DefaultTaxProvider extends TaxProvider {
  getProviderName(): string {
    return 'STORE_BUILTIN_REGIONAL_TAX_ENGINE';
  }

  async calculateTax(params: TaxCalculationParams): Promise<TaxCalculationResult> {
    const { shippingAddress, totalSubtotal } = params;
    const country = shippingAddress.country?.toUpperCase() || 'US';

    // Model different taxation structures based on destination country
    if (['IN', 'INDIA'].includes(country)) {
      // 18% typical GST
      const rate = 0.18;
      const amount = totalSubtotal * rate;
      return {
        totalTaxAmount: Number(amount.toFixed(4)),
        taxLines: [{ taxName: 'GST', rate, amount: Number(amount.toFixed(4)) }],
        providerName: this.getProviderName(),
      };
    } else if (['FR', 'DE', 'IT', 'NL', 'GB', 'UK'].includes(country)) {
      // 20% typical European VAT
      const rate = 0.20;
      const amount = totalSubtotal * rate;
      return {
        totalTaxAmount: Number(amount.toFixed(4)),
        taxLines: [{ taxName: 'VAT', rate, amount: Number(amount.toFixed(4)) }],
        providerName: this.getProviderName(),
      };
    } else {
      // 7.5% fallback standard Sales Tax
      const rate = 0.075;
      const amount = totalSubtotal * rate;
      return {
        totalTaxAmount: Number(amount.toFixed(4)),
        taxLines: [{ taxName: 'SALES_TAX', rate, amount: Number(amount.toFixed(4)) }],
        providerName: this.getProviderName(),
      };
    }
  }
}

export class TaxProviderRegistry {
  private static instance: TaxProviderRegistry;
  private providers: Map<string, TaxProvider> = new Map();
  private defaultProvider: TaxProvider = new DefaultTaxProvider();

  private constructor() {
    this.registerProvider('DEFAULT', this.defaultProvider);
  }

  static getInstance(): TaxProviderRegistry {
    if (!TaxProviderRegistry.instance) {
      TaxProviderRegistry.instance = new TaxProviderRegistry();
    }
    return TaxProviderRegistry.instance;
  }

  registerProvider(countryCode: string, provider: TaxProvider): void {
    this.providers.set(countryCode.toUpperCase(), provider);
  }

  getProvider(countryCode?: string): TaxProvider {
    if (!countryCode) return this.defaultProvider;
    return this.providers.get(countryCode.toUpperCase()) || this.defaultProvider;
  }
}

export const taxProviderRegistry = TaxProviderRegistry.getInstance();
