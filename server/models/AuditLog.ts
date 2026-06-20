import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId; // User or Administrator performing the secure operation
  action: string;                 // e.g. 'REFUND_EXECUTION', 'DISPUTE_MODIFICATION', 'RECONCILIATION_RUN'
  entityType: string;             // e.g. 'PaymentTransaction', 'RefundTransaction', 'Order', 'PaymentDispute'
  entityId: string;               // ID of the target resource
  payload?: any;                  // Secure, structured action telemetry
  reason?: string;                // Context on WHY the operation was performed
  correlationId?: string;         // Request / execution correlation token
  ipAddress?: string;             // IP address of client API caller
  userAgent?: string;             // User agent of the client
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    reason: {
      type: String,
    },
    correlationId: {
      type: String,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only structure, no updates allowed
    capped: false, // Standard dynamic growth, we control pruning administratively
  }
);

// Enforce compound index for operational inquiries
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
