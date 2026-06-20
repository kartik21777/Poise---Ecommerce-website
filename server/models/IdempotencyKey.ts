import mongoose, { Document, Schema } from 'mongoose';

export interface IIdempotencyKey extends Document {
  key: string; // Uniquely identifies the idempotent operation (e.g., checkout session ID or action UUID)
  responseBody?: Record<string, any>; // Cached response payload
  responseStatus?: number; // Cached status code
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const idempotencyKeySchema = new Schema<IIdempotencyKey>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    responseStatus: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      required: true,
      default: 'PENDING',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index in MongoDB
    },
  },
  {
    timestamps: true,
  }
);

export const IdempotencyKey = mongoose.model<IIdempotencyKey>(
  'IdempotencyKey',
  idempotencyKeySchema
);
