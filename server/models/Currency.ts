import mongoose, { Document, Schema } from 'mongoose';

export interface ICurrency extends Document {
  code: string; // ISO 4217, e.g., 'USD', 'INR'
  symbol: string; // $, ₹, €, etc.
  decimalPrecision: number; // e.g. 2 for USD, 0 for JPY
  isEnabled: boolean;
  isBase: boolean; // Is this the internal store catalog base currency?
  createdAt: Date;
  updatedAt: Date;
}

const currencySchema = new Schema<ICurrency>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    symbol: { type: String, required: true, trim: true },
    decimalPrecision: { type: Number, required: true, default: 2, min: 0, max: 4 },
    isEnabled: { type: Boolean, required: true, default: true, index: true },
    isBase: { type: Boolean, required: true, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Currency = mongoose.model<ICurrency>('Currency', currencySchema);
