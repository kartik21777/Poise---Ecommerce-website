import crypto from 'crypto';
import { DistributedLock } from '../models/DistributedLock.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const log = logger('LockService');

export class LockService {
  /**
   * Attempts to acquire an atomic distributed lock
   * @param lockKey The unique lock identifier
   * @param ttlMs Time-to-live for the lock in milliseconds
   * @param holder An optional unique ID of the caller (defaults to auto-generated UUID)
   * @returns Successful lock holding identifier if acquired, or null otherwise
   */
  async acquireLock(lockKey: string, ttlMs: number, holder: string = crypto.randomUUID()): Promise<string | null> {
    const now = new Date();
    const expiresAt = new Date(Date.now() + ttlMs);

    try {
      // Find a lock with this key that has expired, or is already held by us, or create it.
      // MongoDB update with upsert is atomic. If a unique key conflict occurs or criteria don't match,
      // it will throw a duplicate key error (code 11000) or fail.
      const lockDoc = await DistributedLock.findOneAndUpdate(
        {
          _id: lockKey,
          $or: [
            { expiresAt: { $lt: now } }, // Lock is stale
            { holder: holder },          // Existing lock owned by this specific helper context
          ],
        },
        {
          $set: {
            holder,
            expiresAt,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          rawResult: true, // gives us access to whether it updated or created
        }
      );

      // Successfully acquired if document exists and has our holder
      if (lockDoc && lockDoc.holder === holder) {
        log.info(`Lock acquired successfully: ${lockKey}`, { lockKey, holder, ttlMs });
        return holder;
      }
      return null;
    } catch (err: any) {
      // MongoDB code 11000 implies someone else has an active lock with that _id and upsert failed
      if (err.code === 11000) {
        log.warn(`Lock collision - failed to acquire lock: ${lockKey}`, { lockKey });
        return null;
      }
      log.error(`Exception during lock acquisition for key ${lockKey}:`, { error: err.message });
      return null;
    }
  }

  /**
   * Releases an owned lock atomically and safely.
   */
  async releaseLock(lockKey: string, holder: string): Promise<boolean> {
    try {
      const result = await DistributedLock.deleteOne({ _id: lockKey, holder });
      const released = result.deletedCount > 0;
      if (released) {
        log.info(`Lock released successfully: ${lockKey}`, { lockKey, holder });
      } else {
        log.warn(`Lock release attempted but key not found or held by someone else: ${lockKey}`, { lockKey, holder });
      }
      return released;
    } catch (err: any) {
      log.error(`Exception during lock release for key ${lockKey}:`, { error: err.message });
      return false;
    }
  }

  /**
   * Executes a transaction block inside a distributed lock context, self-cleaning when resolved.
   */
  async withLock<T>(lockKey: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const holder = crypto.randomUUID();
    const lockAcquired = await this.acquireLock(lockKey, ttlMs, holder);

    if (!lockAcquired) {
      throw new AppError(423, `Resources are temporarily locked under key: ${lockKey}. Please retry your operation shortly.`);
    }

    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, holder);
    }
  }
}

export const lockService = new LockService();
export default lockService;
