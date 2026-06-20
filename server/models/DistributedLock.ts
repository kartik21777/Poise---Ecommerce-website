import mongoose, { Document, Schema } from 'mongoose';

export interface IDistributedLock {
  _id: string;      // The unique lock key (e.g. 'lock:reconciliation', 'lock:refund:TXN-123')
  holder: string;   // Unique client/process identifier currently holding the lock
  expiresAt: Date;  // Absolute time when the lock expires automatically
  createdAt?: Date;
}

const distributedLockSchema = new Schema<IDistributedLock>(
  {
    _id: {
      type: String,
      required: true,
    },
    holder: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    _id: false, // Override Mongoose default ObjectId generation with our custom string lock key
  }
);

// Create native TTL index as a fallback layer in addition to our logical expiration check
distributedLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DistributedLock = mongoose.model<IDistributedLock>('DistributedLock', distributedLockSchema);
