import { InventoryRecoveryService } from '../services/InventoryRecoveryService.js';

export class InventoryRecoveryWorker {
  private recoveryService: InventoryRecoveryService;
  private intervalId?: NodeJS.Timeout;
  private isProcessing: boolean = false;

  constructor() {
    this.recoveryService = new InventoryRecoveryService();
  }

  start(intervalMs: number = 60000) {
    if (this.intervalId) {
      return; // Already started
    }

    this.intervalId = setInterval(async () => {
      await this.runRecovery();
    }, intervalMs);

    console.log(`[InventoryRecoveryWorker] Started with interval ${intervalMs}ms`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('[InventoryRecoveryWorker] Stopped');
    }
  }

  private async runRecovery() {
    if (this.isProcessing) {
      console.log('[InventoryRecoveryWorker] Previous execution still running. Skipping cycle.');
      return;
    }

    this.isProcessing = true;
    try {
      // Process up to 500 expired reservations per cycle
      const batchSize = 100;
      let totalProcessed = 0;
      let hasMore = true;

      while (hasMore && totalProcessed < 500) {
        const results = await this.recoveryService.recoverExpiredReservations(batchSize);
        totalProcessed += results.processed;

        if (results.processed === 0 || results.failed > 0) {
          // Stop if no records processed or if failures occurred (to backoff)
          hasMore = false;
        }
      }

      if (totalProcessed > 0) {
        console.log(`[InventoryRecoveryWorker] Recovered ${totalProcessed} expired reservations.`);
      }
    } catch (err) {
      console.error('[InventoryRecoveryWorker] Error during recovery cycle:', err);
    } finally {
      this.isProcessing = false;
    }
  }
}
