import mongoose, { Document, Schema } from 'mongoose';

export type SyncDirection = 'INBOUND' | 'OUTBOUND';
export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface IERPSyncLog extends Document {
  entityType: string;
  entityId: string;
  provider: string;
  syncDirection: SyncDirection;
  status: SyncStatus;
  retryCount: number;
  lastAttemptAt?: Date;
  payload?: any;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const erpSyncLogSchema = new Schema<IERPSyncLog>(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    provider: { type: String, required: true, index: true },
    syncDirection: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    payload: { type: Schema.Types.Mixed },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ERPSyncLog = mongoose.model<IERPSyncLog>('ERPSyncLog', erpSyncLogSchema);
