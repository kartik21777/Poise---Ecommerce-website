import mongoose, { Document, Schema } from 'mongoose';

export type GiftCardStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'DISABLED';

export interface IGiftCard extends Document {
  code: string;
  originalValue: number;
  balance: number; // Cached balance matching summation of transaction ledger
  currency: string;
  expirationDate?: Date;
  status: GiftCardStatus;
  issuedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const giftCardSchema = new Schema<IGiftCard>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
    },
    originalValue: {
      type: Number,
      required: true,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
      default: function(this: any) {
        return this.originalValue;
      }
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
    },
    expirationDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REDEEMED', 'EXPIRED', 'DISABLED'],
      default: 'ACTIVE',
      index: true,
    },
    issuedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GiftCard = mongoose.model<IGiftCard>('GiftCard', giftCardSchema);
