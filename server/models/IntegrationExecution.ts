import mongoose, { Document, Schema } from 'mongoose';

export interface IIntegrationExecution extends Document {
  provider: string;
  externalRequestId: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  executedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const integrationExecutionSchema = new Schema<IIntegrationExecution>(
  {
    provider: { type: String, required: true, index: true },
    externalRequestId: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    executedAt: { type: Date },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
  }
);

integrationExecutionSchema.index({ provider: 1, externalRequestId: 1 }, { unique: true });

export const IntegrationExecution = mongoose.model<IIntegrationExecution>('IntegrationExecution', integrationExecutionSchema);
