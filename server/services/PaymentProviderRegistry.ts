import { PaymentProvider } from './PaymentProvider.js';
import { RazorpayProvider } from './RazorpayProvider.js';
import { StripeProvider } from './StripeProvider.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const log = logger('PaymentProviderRegistry');

export interface ProviderCapabilities {
  instantSettle: boolean;
  supportsPartialRefunds: boolean;
  supportedCurrencies: string[];
  supportsWebhooks: boolean;
  requiresClientSdk: boolean;
  isSandbox: boolean;
}

export interface ProviderMetadata {
  gateway: 'RAZORPAY' | 'STRIPE' | 'COD' | string;
  name: string;
  enabled: boolean;
  capabilities: ProviderCapabilities;
}

export class PaymentProviderRegistry {
  private static instance: PaymentProviderRegistry;
  private providers = new Map<string, PaymentProvider>();
  private metadata = new Map<string, ProviderMetadata>();

  private constructor() {
    // Register the standard default Razorpay gateway on startup
    this.registerProvider(
      'RAZORPAY',
      new RazorpayProvider(),
      {
        gateway: 'RAZORPAY',
        name: 'Razorpay Payment Gateway',
        enabled: true,
        capabilities: {
          instantSettle: false,
          supportsPartialRefunds: true,
          supportedCurrencies: ['INR', 'USD'],
          supportsWebhooks: true,
          requiresClientSdk: true,
          isSandbox: process.env.NODE_ENV !== 'production',
        },
      }
    );

    // Register Stripe Provider dynamically with full contract checks
    this.registerProvider(
      'STRIPE',
      new StripeProvider(),
      {
        gateway: 'STRIPE',
        name: 'Stripe International Gateway',
        enabled: true,
        capabilities: {
          instantSettle: true,
          supportsPartialRefunds: true,
          supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR'],
          supportsWebhooks: true,
          requiresClientSdk: false,
          isSandbox: true,
        },
      }
    );

    // Register Cash on Delivery reference metadata
    this.registerMetadata('COD', {
      gateway: 'COD',
      name: 'Cash on Delivery (Manual settlement)',
      enabled: true,
      capabilities: {
        instantSettle: false,
        supportsPartialRefunds: false,
        supportedCurrencies: ['INR'],
        supportsWebhooks: false,
        requiresClientSdk: false,
        isSandbox: false,
      },
    });
  }

  public static getInstance(): PaymentProviderRegistry {
    if (!PaymentProviderRegistry.instance) {
      PaymentProviderRegistry.instance = new PaymentProviderRegistry();
    }
    return PaymentProviderRegistry.instance;
  }

  /**
   * Registers a concrete PaymentProvider class implementation along with capability metadata,
   * enforcing strict structural and functional contracts at runtime.
   */
  public registerProvider(
    gateway: string,
    provider: PaymentProvider,
    meta: ProviderMetadata
  ): void {
    const key = gateway.toUpperCase();

    // Section 2.5: Enforce strict contract validations
    if (!provider) {
      throw new AppError(500, `Contract check failed: Provider instance for ${gateway} is null or undefined.`);
    }

    const requiredMethods: Array<keyof PaymentProvider> = [
      'createPaymentSession',
      'verifyWebhook',
      'fetchPayment',
      'refundPayment',
    ];

    for (const method of requiredMethods) {
      if (typeof provider[method] !== 'function') {
        throw new AppError(
          500,
          `Contract compliance error: Provider for ${gateway} fails to implement required method: ${method}()`
        );
      }
    }

    // Validate capability metadata
    if (!meta || !meta.capabilities) {
      throw new AppError(500, `Contract compliance error: Provider metadata or capabilities record is missing for ${gateway}.`);
    }

    if (!Array.isArray(meta.capabilities.supportedCurrencies) || meta.capabilities.supportedCurrencies.length === 0) {
      throw new AppError(500, `Contract compliance error: Provider capability metadata must declare at least one supported currency.`);
    }

    this.providers.set(key, provider);
    this.metadata.set(key, meta);
    log.info(`Payment provider registered: ${key}`, { name: meta.name, enabled: meta.enabled });
  }

  /**
   * Safe registration of metadata for future or disconnected gateways
   */
  public registerMetadata(gateway: string, meta: ProviderMetadata): void {
    this.metadata.set(gateway.toUpperCase(), meta);
  }

  /**
   * Resolves a payment provider instance dynamically
   */
  public getProvider(gateway: 'RAZORPAY' | 'STRIPE' | string): PaymentProvider {
    const key = gateway.toUpperCase();
    const provider = this.providers.get(key);
    
    if (!provider) {
      const meta = this.metadata.get(key);
      if (meta && !meta.enabled) {
        throw new AppError(400, `Payment gateway ${gateway} is in maintenance or disabled. Please use an alternative gateway.`);
      }
      throw new AppError(400, `No active implementation registered for payment gateway: ${gateway}`);
    }
    
    return provider;
  }

  /**
   * Discovers capability credentials and metadata for a given gateway
   */
  public getProviderMetadata(gateway: string): ProviderMetadata {
    const key = gateway.toUpperCase();
    const meta = this.metadata.get(key);
    if (!meta) {
      throw new AppError(404, `No metadata found mapping to gateway: ${gateway}`);
    }
    return meta;
  }

  /**
   * Lists all gateways registered inside the system
   */
  public getRegisteredGateways(): ProviderMetadata[] {
    return Array.from(this.metadata.values());
  }
}

export const paymentProviderRegistry = PaymentProviderRegistry.getInstance();
export default paymentProviderRegistry;
