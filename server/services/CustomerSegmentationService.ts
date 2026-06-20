import mongoose from 'mongoose';
import { CustomerSegment, ICustomerSegment } from '../models/CustomerSegment.js';
import { Order } from '../models/Order.js';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

const log = logger('CustomerSegmentationService');

export class CustomerSegmentationService {
  /**
   * Evaluate if a user belongs to a specific customer segment
   */
  async isUserInSegment(userId: string, segmentId: string): Promise<boolean> {
    const segment = await CustomerSegment.findById(segmentId);
    if (!segment || segment.status !== 'ACTIVE') return false;

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Get order aggregations for this user
    const paidStatuses = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    
    // Calculate orders information
    const query: Record<string, unknown> = {
      user: userObjId,
      status: { $in: paidStatuses }
    };
    const orders = await Order.find(query);

    const lifetimeValue = orders.reduce((acc, order) => acc + order.total, 0);
    const orderCount = orders.length;

    // Check last order duration
    let lastOrderDays = Number.MAX_SAFE_INTEGER;
    if (orderCount > 0) {
      const lastOrderDate = orders.reduce((max, order) => (order.createdAt > max ? order.createdAt : max), orders[0].createdAt);
      const diffMs = Date.now() - lastOrderDate.getTime();
      lastOrderDays = diffMs / (1000 * 60 * 60 * 24);
    }

    // 1. Min Lifetime Value Check
    if (segment.conditions.minLifetimeValue && segment.conditions.minLifetimeValue > 0) {
      if (lifetimeValue < segment.conditions.minLifetimeValue) return false;
    }

    // 2. Min Order Count Check
    if (segment.conditions.minOrderCount && segment.conditions.minOrderCount > 0) {
      if (orderCount < segment.conditions.minOrderCount) return false;
    }

    // 3. Inactive check (lastOrderWithinDays: e.g. inactive for > 30 days means isUserInSegment will be true if lastOrderDays is greater or equal to this limit?
    // Wait, the segment could be "Inactive Customers" with "lastOrderWithinDays: 30" (meaning NO order within 30 days). So if days > 30, they belong to segment).
    if (segment.conditions.lastOrderWithinDays && segment.conditions.lastOrderWithinDays > 0) {
      if (lastOrderDays < segment.conditions.lastOrderWithinDays) return false;
    }

    // 4. Loyalty Tier Check
    if (segment.conditions.loyaltyTier) {
      const loyaltyAccount = await LoyaltyAccount.findOne({ userId: userObjId });
      if (!loyaltyAccount || loyaltyAccount.currentTier !== segment.conditions.loyaltyTier) {
        return false;
      }
    }

    // 5. Vendor-specific customer checks: Has the customer purchased from this vendor?
    if (segment.conditions.vendorIdScope) {
      const hasPurchasedFromVendor = orders.some(order => 
        (order.items as Array<{vendorId?: mongoose.Types.ObjectId}>).some(item => item.vendorId?.toString() === segment.conditions.vendorIdScope?.toString())
      );
      if (!hasPurchasedFromVendor) return false;
    }

    return true;
  }

  /**
   * Get all users matching a specific segment
   * 
   * ARCHITECTURE NOTE — SEGMENTATION SCALE LIMITATION
   * 
   * CURRENT BEHAVIOR:
   * The segmentation engine currently calculates lifetime value, order counts, 
   * and last order dates on the fly using a large $lookup across the Order collection.
   * 
   * SCALABILITY RISKS:
   * - At 100k users: Aggregation pipeline will perform acceptably but may show latency (1-3 seconds).
   * - At 1M users: Deep collection scans and array manipulations on paidOrders will cause memory pressure 
   *   and query delays (10+ seconds), potentially impacting the database cluster.
   * - At 10M users: The aggregation pipeline will likely exceed MongoDB memory limits and timeout. 
   *   Collection scans across tens of millions of orders are unviable for real-time querying.
   * 
   * FUTURE PHASE 12+ RECOMMENDATION:
   * 1. Customer Metrics Projection Table: Introduce a dedicated `CustomerMetrics` projection collection.
   * 2. Incremental Aggregation Strategy: Pre-calculate metrics (LTV, order count, last order date) 
   *    incrementally when an order status reaches 'PAID'/etc, instead of aggregating at read-time.
   * 3. Background Metrics Updater: Implement a scheduled worker or change stream listener to 
   *    asynchronously update the projection collection without blocking the main application flow.
   */
  async getSegmentUsers(segmentId: string): Promise<string[]> {
    const segment = await CustomerSegment.findById(segmentId);
    if (!segment || segment.status !== 'ACTIVE') return [];

    const pipeline: mongoose.PipelineStage[] = [
      { $match: { status: 'active' } }
    ];

    // Lookup Orders
    pipeline.push({
      $lookup: {
        from: Order.collection.name,
        localField: '_id',
        foreignField: 'user',
        pipeline: [
          { $match: { status: { $in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }
        ],
        as: 'paidOrders'
      }
    });

    // Lookup Loyalty Account if needed
    if (segment.conditions.loyaltyTier) {
      pipeline.push({
        $lookup: {
          from: LoyaltyAccount.collection.name,
          localField: '_id',
          foreignField: 'userId',
          as: 'loyaltyAccount'
        }
      });
    }

    // Compute metrics
    pipeline.push({
      $addFields: {
        lifetimeValue: { $sum: '$paidOrders.total' },
        orderCount: { $size: '$paidOrders' },
        maxOrderDate: { $max: '$paidOrders.createdAt' }
      }
    });

    pipeline.push({
      $addFields: {
        lastOrderDays: {
          $cond: {
            if: { $gt: ['$orderCount', 0] },
            then: {
              $divide: [
                { $subtract: [new Date(), '$maxOrderDate'] },
                1000 * 60 * 60 * 24
              ]
            },
            else: Number.MAX_SAFE_INTEGER
          }
        }
      }
    });

    // Construct match stage based on conditions
    const matchStage: Record<string, unknown> = {};

    if (segment.conditions.minLifetimeValue && segment.conditions.minLifetimeValue > 0) {
      matchStage.lifetimeValue = { $gte: segment.conditions.minLifetimeValue };
    }
    
    if (segment.conditions.minOrderCount && segment.conditions.minOrderCount > 0) {
      matchStage.orderCount = { $gte: segment.conditions.minOrderCount };
    }

    if (segment.conditions.lastOrderWithinDays && segment.conditions.lastOrderWithinDays > 0) {
      matchStage.lastOrderDays = { $gte: segment.conditions.lastOrderWithinDays };
    }

    if (segment.conditions.loyaltyTier) {
      matchStage['loyaltyAccount.0.currentTier'] = segment.conditions.loyaltyTier;
    }

    if (segment.conditions.vendorIdScope) {
      matchStage['paidOrders.items.vendorId'] = new mongoose.Types.ObjectId(segment.conditions.vendorIdScope);
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({ $project: { _id: 1 } });

    const results = await User.aggregate(pipeline);
    return results.map(r => r._id.toString());
  }

  /**
   * Create standard segments automatically at startup/request if they don't exist
   */
  async bootstrapSegments(): Promise<void> {
    const defaults = [
      {
        name: 'High-Value Customers',
        description: 'Customers with over $500 in lifetime spend and at least 3 orders',
        conditions: { minLifetimeValue: 500, minOrderCount: 3 },
      },
      {
        name: 'Frequent Shoppers',
        description: 'Loyal shoppers with 5 or more completed orders',
        conditions: { minOrderCount: 5 },
      },
      {
        name: 'Inactive Customers',
        description: 'Customers who have not placed an order in the last 60 days',
        conditions: { lastOrderWithinDays: 60 },
      },
    ];

    for (const def of defaults) {
      const exists = await CustomerSegment.findOne({ name: def.name });
      if (!exists) {
        await CustomerSegment.create(def);
        log.info(`Bootstrapped standard segment: ${def.name}`);
      }
    }
  }
}

export const customerSegmentationService = new CustomerSegmentationService();
