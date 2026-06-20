import mongoose, { Schema, Document } from 'mongoose';

export type GatewayHealthState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface IGatewayHealthHistory extends Document {
  gateway: string;
  status: GatewayHealthState;
  latencyMs: number;
  isSuccess: boolean;
  errorMessage?: string;
  checkedAt: Date;
}

const gatewayHealthHistorySchema = new Schema<IGatewayHealthHistory>({
  gateway: {
    type: String,
    required: true,
    index: true,
    uppercase: true,
  },
  status: {
    type: String,
    enum: ['HEALTHY', 'DEGRADED', 'UNAVAILABLE'],
    required: true,
    index: true,
  },
  latencyMs: {
    type: Number,
    required: true,
  },
  isSuccess: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
  },
  checkedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

// Configure automatic TTL indexes if we desire automatic cleanup, but let us keep it indexed for rapid range filters.
gatewayHealthHistorySchema.index({ gateway: 1, checkedAt: -1 });

export const GatewayHealthHistory = mongoose.model<IGatewayHealthHistory>(
  'GatewayHealthHistory',
  gatewayHealthHistorySchema
);
export default GatewayHealthHistory;
