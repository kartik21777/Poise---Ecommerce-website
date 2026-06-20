import mongoose, { Document, Schema } from 'mongoose';

export interface IStoreCreditAccount extends Document {
  user: mongoose.Types.ObjectId;
  currency: string;
  balance: number; // Cached balance representing ledger sum
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeCreditAccountSchema = new Schema<IStoreCreditAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compounded index - unique combination of customer and currency to avoid drift or multi-currency mixups
storeCreditAccountSchema.index({ user: 1, currency: 1 }, { unique: true });

export const StoreCreditAccount = mongoose.model<IStoreCreditAccount>('StoreCreditAccount', storeCreditAccountSchema);
