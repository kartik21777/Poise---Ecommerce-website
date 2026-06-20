import mongoose from 'mongoose';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorPayout } from '../models/VendorPayout.js';
import { Order } from '../models/Order.js';
import { Vendor } from '../models/Vendor.js';
import { lockService } from './LockService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const log = logger('PayoutService');

export class PayoutService {
  /**
   * Generates payouts for all vendors for a given billing period.
   * Ensures idempotency: duplicate payouts are impossible because it relies on VendorOrders without a payoutId.
   */
  async generatePayouts(periodStart: Date, periodEnd: Date) {
    const lockKey = `lock:payout_generation:${periodStart.getTime()}-${periodEnd.getTime()}`;
    
    return await lockService.withLock(lockKey, 30000, async () => {
      // Find all vendors
      const vendors = await Vendor.find({ status: 'ACTIVE' });
      const createdPayouts = [];

      for (const vendor of vendors) {
        // Find unpaid vendor orders in this period that aren't cancelled or refunded outright
        const ordersEligibleForPayout = await VendorOrder.find({
          vendorId: vendor._id,
          createdAt: { $gte: periodStart, $lte: periodEnd },
          payoutId: { $exists: false },
          status: { $nin: ['CANCELLED', 'REFUNDED'] }
        });

        if (ordersEligibleForPayout.length === 0) continue;

        let totalGross = 0;
        let totalCommission = 0;
        let totalNet = 0;
        const validOrderIds: mongoose.Types.ObjectId[] = [];

        // Manually inspect each order's parent Order to handle partial refunds correctly
        for (const vOrder of ordersEligibleForPayout) {
          const parentOrder = await Order.findById(vOrder.parentOrderId);
          if (!parentOrder) continue;

          // If parent is fully refunded or cancelled, mark this vendor order as ineligible and sync status
          if (parentOrder.status === 'REFUNDED' || parentOrder.status === 'CANCELLED') {
              vOrder.status = parentOrder.status as any;
              vOrder.paymentStatus = parentOrder.paymentStatus as any;
              await vOrder.save();
              continue;
          }

          let gross = vOrder.total;
          let commission = vOrder.commissionAmount;
          let net = vOrder.netVendorRevenue;

          // Handle Partial Refunds seamlessly: calculate percentage of original subtotal that was refunded
          // (Because refunds don't natively map to specific vendor items in this generic architecture, we apply proportional reduction)
          const totalRefundedSum = Number((parentOrder as any).metadata?.totalRefunded || 0);

          if (totalRefundedSum > 0) {
              const refundRatio = totalRefundedSum / parentOrder.total;
              const adjustmentFactor = 1 - refundRatio;
              
              gross = Number((gross * adjustmentFactor).toFixed(2));
              commission = Number((commission * adjustmentFactor).toFixed(2));
              net = Number((net * adjustmentFactor).toFixed(2));
          }

          totalGross += gross;
          totalCommission += commission;
          totalNet += net;
          validOrderIds.push(vOrder._id as mongoose.Types.ObjectId);
        }

        if (validOrderIds.length > 0) {
          const payout = new VendorPayout({
            vendorId: vendor._id,
            periodStart,
            periodEnd,
            grossAmount: Number(totalGross.toFixed(2)),
            commissionAmount: Number(totalCommission.toFixed(2)),
            netAmount: Number(totalNet.toFixed(2)),
            currency: 'USD',
            status: 'PENDING',
            includedVendorOrders: validOrderIds
          });

          await payout.save();

          // Mark vendor orders as included in this payout to prevent duplicates
          await VendorOrder.updateMany(
            { _id: { $in: validOrderIds } },
            { $set: { payoutId: payout._id } }
          );

          createdPayouts.push(payout);
        }
      }

      log.info(`Payout generation completed. Created ${createdPayouts.length} payout records.`);
      return createdPayouts;
    });
  }
}
