import mongoose, { Document, Schema } from 'mongoose';

export interface IMarketingPreference extends Document {
  userId: mongoose.Types.ObjectId;
  emailOptIn: boolean;
  smsOptIn: boolean;
  pushOptIn: boolean;
  consentTimestamp: Date;
  consentSource: string;
  createdAt: Date;
  updatedAt: Date;
}

const marketingPreferenceSchema = new Schema<IMarketingPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    emailOptIn: { type: Boolean, default: false },
    smsOptIn: { type: Boolean, default: false },
    pushOptIn: { type: Boolean, default: false },
    consentTimestamp: { type: Date, default: Date.now },
    consentSource: { type: String, default: 'SIGNUP' },
  },
  { timestamps: true }
);

export const MarketingPreference = mongoose.model<IMarketingPreference>('MarketingPreference', marketingPreferenceSchema);
