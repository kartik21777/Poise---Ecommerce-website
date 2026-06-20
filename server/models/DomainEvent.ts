import mongoose, { Document, Schema } from 'mongoose';
import { randomUUID } from 'crypto';

export interface IDomainEvent extends Document {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  processedAt?: Date;
  eventVersion: string;
  schemaVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

const domainEventSchema = new Schema<IDomainEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true, default: () => randomUUID() },
    eventType: { type: String, required: true, index: true },
    aggregateType: { type: String, required: true },
    aggregateId: { type: String, required: true, index: true },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      validate: [
        {
          validator: function (v: unknown) {
            try {
              const str = JSON.stringify(v);
              // limit to 50KB payload to prevent bloat
              return Buffer.byteLength(str, 'utf8') <= 50 * 1024;
            } catch (e) {
              return false; // Not serializable
            }
          },
          message: 'Payload must be JSON serializable and less than 50KB in size.',
        },
      ],
    },
    occurredAt: { type: Date, required: true, index: true },
    processedAt: { type: Date },
    eventVersion: { type: String, required: true },
    schemaVersion: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

domainEventSchema.index({ aggregateType: 1, occurredAt: -1 });
domainEventSchema.index({ eventType: 1, occurredAt: -1 });
domainEventSchema.index({ aggregateType: 1, aggregateId: 1, occurredAt: 1 });

export const DomainEvent = mongoose.model<IDomainEvent>('DomainEvent', domainEventSchema);
