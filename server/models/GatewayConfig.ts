import mongoose, { Schema, Document } from 'mongoose';

export interface IGatewayConfig extends Document {
  gateway: 'RAZORPAY' | 'STRIPE' | string;
  name: string;
  enabled: boolean;
  routingPriority: number; // For prioritizing selection (higher is preferred)
  failoverPriority: number; // Order in which failovers occur (higher is tried first)
  supportedCurrencies: string[];
  supportedCountries: string[]; // e.g. ['IN'] or ['US', 'CA', 'GB']
  paymentMethods: string[]; // ['card', 'upi', 'netbanking']
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const gatewayConfigSchema = new Schema<IGatewayConfig>(
  {
    gateway: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    enabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    routingPriority: {
      type: Number,
      required: true,
      default: 1,
    },
    failoverPriority: {
      type: Number,
      required: true,
      default: 1,
    },
    supportedCurrencies: {
      type: [String],
      default: ['INR', 'USD'],
    },
    supportedCountries: {
      type: [String],
      default: [], // Empty means universally supported
    },
    paymentMethods: {
      type: [String],
      default: ['card'],
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const GatewayConfig = mongoose.model<IGatewayConfig>('GatewayConfig', gatewayConfigSchema);
export default GatewayConfig;
