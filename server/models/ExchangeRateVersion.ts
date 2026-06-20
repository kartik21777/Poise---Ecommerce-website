import mongoose, { Document, Schema } from 'mongoose';

export interface IExchangeRateItem {
  targetCurrency: string; // ISO Code (e.g., 'INR')
  rate: number; // Conversion multiplier relative to the Base currency
}

export interface IExchangeRateVersion extends Document {
  versionNumber: number; // Incrementing unique index
  baseCurrency: string; // ISO Code of master catalog rate
  rates: IExchangeRateItem[]; // Rates mapping for converted scopes
  source: 'MANUAL' | 'AUTOMATED';
  createdBy?: mongoose.Types.ObjectId;
  effectiveFrom: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const exchangeRateItemSchema = new Schema<IExchangeRateItem>({
  targetCurrency: { type: String, required: true, uppercase: true, trim: true },
  rate: { type: Number, required: true, min: 0.000001 },
}, { _id: false });

const exchangeRateVersionSchema = new Schema<IExchangeRateVersion>(
  {
    versionNumber: { type: Number, required: true, unique: true, index: true },
    baseCurrency: { type: String, required: true, uppercase: true, trim: true, default: 'USD' },
    rates: [exchangeRateItemSchema],
    source: { type: String, enum: ['MANUAL', 'AUTOMATED'], default: 'MANUAL', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    effectiveFrom: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const ExchangeRateVersion = mongoose.model<IExchangeRateVersion>('ExchangeRateVersion', exchangeRateVersionSchema);
