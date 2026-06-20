import mongoose, { Document, Schema } from 'mongoose';

export interface IVendorPayout extends Document {
  vendorId: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: number; // Sum of total vendor orders 
  commissionAmount: number; // Platform cut
  netAmount: number; // Amount to actually pay to the vendor
  currency: string;
  
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
  paidAt?: Date;

  includedVendorOrders: mongoose.Types.ObjectId[];
  
  paymentMethodDetails?: string; 
  transactionReference?: string; // external bank / stripe transfer ID

  createdAt: Date;
  updatedAt: Date;
}

const vendorPayoutSchema = new Schema<IVendorPayout>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    grossAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },
    netAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    
    status: { type: String, enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED'], default: 'PENDING', index: true },
    paidAt: { type: Date },

    includedVendorOrders: [{ type: Schema.Types.ObjectId, ref: 'VendorOrder' }],

    paymentMethodDetails: { type: String },
    transactionReference: { type: String },
  },
  { timestamps: true }
);

vendorPayoutSchema.index({ vendorId: 1, periodStart: -1 });

export const VendorPayout = mongoose.model<IVendorPayout>('VendorPayout', vendorPayoutSchema);
