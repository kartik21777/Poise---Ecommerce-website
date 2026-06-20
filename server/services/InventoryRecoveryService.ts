import mongoose from 'mongoose';
import { randomUUID } from 'crypto';
import { InventoryReservation } from '../models/InventoryReservation.js';
import { InventoryAllocation } from '../models/InventoryAllocation.js';
import { DomainEvent } from '../models/DomainEvent.js';

export class InventoryRecoveryService {
  /**
   * Recovers expired inventory reservations in batches.
   * Finds reservations that are ACTIVE but past their expiresAt.
   * Releases the reserved stock back to available stock.
   */
  async recoverExpiredReservations(batchSize: number = 100) {
    const now = new Date();
    const executionId = randomUUID();
    
    // Find expired active reservations
    const expiredReservations = await InventoryReservation.find({
      status: 'ACTIVE',
      expiresAt: { $lte: now },
    })
      .limit(batchSize)
      .lean();

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const reservation of expiredReservations) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Ensure idempotency: Lock the reservation and check its state
        const updatedReservation = await InventoryReservation.findOneAndUpdate(
          { _id: reservation._id, status: 'ACTIVE' },
          { $set: { status: 'EXPIRED' } },
          { new: true, session }
        );

        if (!updatedReservation) {
          // It was already processed by another worker
          await session.abortTransaction();
          session.endSession();
          continue;
        }

        // Restore inventory allocation
        const updateQuery: any = {
          product: reservation.product,
          location: reservation.warehouse,
        };
        if (reservation.variant) {
          updateQuery.variant = reservation.variant;
        }

        const updatedAllocation = await InventoryAllocation.findOneAndUpdate(
          updateQuery,
          {
            $inc: {
              reservedQuantity: -reservation.quantity,
              availableQuantity: reservation.quantity,
            },
          },
          { new: true, session }
        );

        if (!updatedAllocation) {
          throw new Error(`InventoryAllocation not found for product ${reservation.product} at location ${reservation.warehouse}`);
        }

        // Emit domain event
        await DomainEvent.create(
          [
            {
              eventType: 'INVENTORY_RESERVATION_EXPIRED',
              aggregateType: 'INVENTORY_RESERVATION',
              aggregateId: reservation._id.toString(),
              payload: {
                reservationId: reservation._id.toString(),
                productId: reservation.product.toString(),
                variantId: reservation.variant?.toString(),
                quantity: reservation.quantity,
                locationId: reservation.warehouse.toString(),
                expiredAt: reservation.expiresAt.toISOString(),
                releasedQuantity: reservation.quantity,
                recoveredAt: now.toISOString(),
                executionId,
              },
              occurredAt: now,
              eventVersion: '1.0',
              schemaVersion: '1.0',
            },
          ],
          { session }
        );

        await session.commitTransaction();
        results.processed++;
      } catch (err: any) {
        await session.abortTransaction();
        results.failed++;
        results.errors.push(`Failed to recover reservation ${reservation._id}: ${err.message}`);
        console.error(`Failed to recover reservation ${reservation._id}`, err);
      } finally {
        session.endSession();
      }
    }

    return results;
  }
}
