import mongoose, { Document, Schema } from 'mongoose';

export interface IExperimentAssignment extends Document {
  experimentId: mongoose.Types.ObjectId;
  experimentName: string;
  userId?: mongoose.Types.ObjectId;
  visitorId: string;
  variant: string;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const experimentAssignmentSchema = new Schema<IExperimentAssignment>(
  {
    experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment', required: true, index: true },
    experimentName: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    visitorId: { type: String, required: true, index: true },
    variant: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

experimentAssignmentSchema.index({ experimentId: 1, visitorId: 1 }, { unique: true });

export const ExperimentAssignment = mongoose.model<IExperimentAssignment>('ExperimentAssignment', experimentAssignmentSchema);
