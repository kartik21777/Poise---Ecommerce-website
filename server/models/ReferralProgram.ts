import mongoose, { Schema, Document } from 'mongoose';

export interface IReferralProgram extends Document {
  referrerUserId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referralCode: string;
  status: 'PENDING' | 'REWARDED' | 'FLAGGED' | 'REVOKED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralProgramSchema: Schema = new Schema(
  {
    referrerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    referralCode: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['PENDING', 'REWARDED', 'FLAGGED', 'REVOKED'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const ReferralProgram = mongoose.model<IReferralProgram>('ReferralProgram', ReferralProgramSchema);
