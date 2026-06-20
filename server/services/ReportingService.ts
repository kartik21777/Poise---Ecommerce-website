import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { InventoryAllocation } from '../models/InventoryAllocation.js';
import { LoyaltyLiabilityService } from './LoyaltyLiabilityService.js';
import { VendorPayout } from '../models/VendorPayout.js';
import { DomainEvent } from '../models/DomainEvent.js';
import { ExchangeRateVersion } from '../models/ExchangeRateVersion.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';

export class ReportingService {
  /**
   * Generates a snapshot of revenue aggregated by day/month.
   * This handles historical data exports.
   */
  async generateRevenueReport(startDate: Date, endDate: Date, granularity: 'DAILY' | 'MONTHLY') {
    const formatStr = granularity === 'DAILY' ? '%Y-%m-%d' : '%Y-%m';
    
    const pipeline = [
      {
        $match: {
          status: { $in: ['PAID', 'SHIPPED', 'DELIVERED', 'PROCESSING'] },
          createdAt: { $gte: startDate, $lte: endDate },
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: formatStr, date: '$createdAt' } },
          totalRevenue: { $sum: '$total' },
          totalSubtotal: { $sum: '$subtotal' },
          totalTax: { $sum: '$tax' },
          totalShipping: { $sum: '$shipping' },
          totalDiscount: { $sum: '$promoDiscountAmount' },
          orderCount: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 as const } }
    ];

    const [results, latestExchangeRate, latestLoyaltyValuation] = await Promise.all([
      Order.aggregate(pipeline),
      ExchangeRateVersion.findOne().sort({ versionNumber: -1 }),
      LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 })
    ]);
    
    // Dispatch domain event reporting snapshot creation for auditability
    await DomainEvent.create({
      eventType: 'REPORT_GENERATED',
      aggregateType: 'SYSTEM',
      aggregateId: 'REPORTING',
      payload: {
        reportType: 'REVENUE',
        startDate,
        endDate,
        granularity,
        recordCount: results.length,
      },
      occurredAt: new Date(),
      eventVersion: '1.0',
      schemaVersion: '1.0',
    });

    return {
      metadata: {
        reportType: 'REVENUE',
        generatedAt: new Date(),
        reportingTimestamp: new Date().toISOString(),
        pricingVersion: '1.0', // Reference point for pricing models
        exchangeRateVersion: latestExchangeRate?.versionNumber || 1,
        loyaltyValuationVersion: latestLoyaltyValuation?.versionNumber || 1,
      },
      data: results
    };
  }

  async generateInventoryReport(locationId?: string) {
    const matchStage: Record<string, unknown> = {};
    if (locationId) {
      matchStage.location = new mongoose.Types.ObjectId(locationId);
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$product',
          totalAvailable: { $sum: '$availableQuantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          locations: { $addToSet: '$location' }
        }
      }
    ];

    const [results, latestExchangeRate, latestLoyaltyValuation] = await Promise.all([
      InventoryAllocation.aggregate(pipeline),
      ExchangeRateVersion.findOne().sort({ versionNumber: -1 }),
      LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 })
    ]);

    return {
      metadata: {
        reportType: 'INVENTORY_SNAPSHOT',
        generatedAt: new Date(),
        reportingTimestamp: new Date().toISOString(),
        pricingVersion: '1.0',
        exchangeRateVersion: latestExchangeRate?.versionNumber || 1,
        loyaltyValuationVersion: latestLoyaltyValuation?.versionNumber || 1,
      },
      data: results
    };
  }
}
