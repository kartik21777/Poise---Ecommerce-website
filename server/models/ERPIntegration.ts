import mongoose, { Document, Schema } from 'mongoose';

export interface IERPIntegration extends Document {
  provider: 'SAP' | 'ORACLE' | 'ODOO' | string;
  config: Record<string, string>;
  syncSettings: {
    inventoryEventEnabled: boolean;
    productEventEnabled: boolean;
    orderEventEnabled: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const erpIntegrationSchema = new Schema<IERPIntegration>(
  {
    provider: { type: String, required: true, unique: true, index: true },
    config: { type: Schema.Types.Mixed, default: {} },
    syncSettings: {
      inventoryEventEnabled: { type: Boolean, default: false },
      productEventEnabled: { type: Boolean, default: false },
      orderEventEnabled: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const ERPIntegration = mongoose.model<IERPIntegration>('ERPIntegration', erpIntegrationSchema);
