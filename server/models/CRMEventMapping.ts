import mongoose, { Document, Schema } from 'mongoose';

export interface ICRMEventMapping extends Document {
  internalEvent: string;
  externalProvider: string;
  externalEvent: string;
  transformationVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const crmEventMappingSchema = new Schema<ICRMEventMapping>(
  {
    internalEvent: { type: String, required: true, index: true },
    externalProvider: { type: String, required: true, index: true },
    externalEvent: { type: String, required: true },
    transformationVersion: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

crmEventMappingSchema.index({ internalEvent: 1, externalProvider: 1, transformationVersion: 1 }, { unique: true });

export const CRMEventMapping = mongoose.model<ICRMEventMapping>('CRMEventMapping', crmEventMappingSchema);
