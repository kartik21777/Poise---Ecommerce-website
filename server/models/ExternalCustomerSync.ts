import mongoose, { Document, Schema } from 'mongoose';

export interface IExternalCustomerSync extends Document {
  user: mongoose.Types.ObjectId;
  provider: 'HUBSPOT' | 'SALESFORCE' | 'ZOHO' | string;
  externalId: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  lastSyncedAt?: Date;
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const externalCustomerSyncSchema = new Schema<IExternalCustomerSync>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true, index: true },
    externalId: { type: String, required: true, index: true },
    syncStatus: {
      type: String,
      enum: ['PENDING', 'SYNCED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    lastSyncedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

externalCustomerSyncSchema.index({ user: 1, provider: 1 }, { unique: true });

export const ExternalCustomerSync = mongoose.model<IExternalCustomerSync>('ExternalCustomerSync', externalCustomerSyncSchema);
