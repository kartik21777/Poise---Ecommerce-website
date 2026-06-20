import mongoose, { Document, Schema } from 'mongoose';

export type POSSessionStatus = 'OPEN' | 'CLOSED' | 'SUSPENDED';

export interface IPOSSession extends Document {
  store: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  device: string;
  status: POSSessionStatus;
  openedAt: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const posSessionSchema = new Schema<IPOSSession>(
  {
    store: { type: Schema.Types.ObjectId, ref: 'InventoryLocation', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    device: { type: String, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'SUSPENDED'],
      default: 'OPEN',
      index: true,
    },
    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const POSSession = mongoose.model<IPOSSession>('POSSession', posSessionSchema);
