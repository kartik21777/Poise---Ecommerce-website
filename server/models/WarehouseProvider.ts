import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouseProvider extends Document {
  name: string;
  providerType: 'INTERNAL' | '3PL';
  integrationConfig: Record<string, string>;
  supportedLocations: mongoose.Types.ObjectId[];
  capabilities: {
    handlesFulfillment: boolean;
    handlesReturns: boolean;
    supportsRealTimeInventoryUpdates: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const warehouseProviderSchema = new Schema<IWarehouseProvider>(
  {
    name: { type: String, required: true, unique: true },
    providerType: { type: String, enum: ['INTERNAL', '3PL'], required: true },
    integrationConfig: { type: Schema.Types.Mixed, default: {} },
    supportedLocations: [{ type: Schema.Types.ObjectId, ref: 'InventoryLocation' }],
    capabilities: {
      handlesFulfillment: { type: Boolean, default: false },
      handlesReturns: { type: Boolean, default: false },
      supportsRealTimeInventoryUpdates: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const WarehouseProvider = mongoose.model<IWarehouseProvider>('WarehouseProvider', warehouseProviderSchema);
