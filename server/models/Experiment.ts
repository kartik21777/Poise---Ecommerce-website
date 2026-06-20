import mongoose, { Document, Schema } from 'mongoose';

export interface IExperiment extends Document {
  name: string;
  description?: string;
  variants: string[];
  trafficAllocation: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const experimentSchema = new Schema<IExperiment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    variants: [{ type: String, required: true }],
    trafficAllocation: { type: Number, default: 1.0, min: 0, max: 1 },
    status: { type: String, enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'], default: 'DRAFT', index: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Experiment = mongoose.model<IExperiment>('Experiment', experimentSchema);
