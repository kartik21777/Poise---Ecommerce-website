import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Promotion } from '../models/Promotion.js';
import { EmailCampaign } from '../models/EmailCampaign.js';
import { AttributionEvent } from '../models/AttributionEvent.js';
import { Order } from '../models/Order.js';

export interface CouponMetric {
  code: string;
  totalRedemptions: number;
  totalDiscountSaved: number;
  uniqueBuyers: number;
}

export interface PromotionPerfMetric {
  promotionId: string;
  name: string;
  type: string;
  timesApplied: number;
  totalDiscountValue: number;
}

export interface CampaignSummaryMetrics {
  campaignId: string;
  name: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  conversions: number;
}

export class MarketingAnalyticsService {
  /**
   * Tracks and resolves high performance dashboard-ready overview metrics
   */
  async getMarketingOverview(): Promise<any> {
    const totalCouponRedeemedCount = await CouponRedemption.countDocuments();
    
    // Aggregation for dynamic coupon metrics
    const couponUsageStats = await CouponRedemption.aggregate([
      {
        $group: {
          _id: '$couponCode',
          totalRedemptions: { $sum: 1 },
          totalDiscountSaved: { $sum: '$discountAmount' },
          uniqueBuyers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          code: '$_id',
          totalRedemptions: 1,
          totalDiscountSaved: 1,
          uniqueBuyers: { $size: '$uniqueBuyers' }
        }
      }
    ]);

    // Aggregations for Automatic Promotions
    const activeOrders = await Order.find({ status: { $ne: 'CANCELLED' } });
    const promotionStatsMap = new Map<string, { name: string; type: string; count: number; saved: number }>();

    for (const order of activeOrders) {
      if (order.appliedPromotionSnaps && order.appliedPromotionSnaps.length > 0) {
        for (const snap of order.appliedPromotionSnaps) {
          const promoIdStr = snap.promotionId?.toString() || 'unknown';
          const existing = promotionStatsMap.get(promoIdStr) || { name: snap.name || 'Promo', type: snap.type || 'promotion', count: 0, saved: 0 };
          existing.count += 1;
          existing.saved += snap.discountAmount || 0;
          promotionStatsMap.set(promoIdStr, existing);
        }
      }
    }

    const promotionPerformance: any[] = Array.from(promotionStatsMap.entries()).map(([id, info]) => ({
      promotionId: id,
      name: info.name,
      type: info.type,
      timesApplied: info.count,
      totalDiscountValue: Number(info.saved.toFixed(2)),
    }));

    // Campaign performances
    const campaigns = await EmailCampaign.find({});
    const campaignStats: CampaignSummaryMetrics[] = campaigns.map((camp) => {
      const openRate = camp.metrics.sentCount > 0 ? (camp.metrics.openCount / camp.metrics.sentCount) * 100 : 0;
      const clickRate = camp.metrics.sentCount > 0 ? (camp.metrics.clickCount / camp.metrics.sentCount) * 100 : 0;

      return {
        campaignId: camp._id.toString(),
        name: camp.name,
        sentCount: camp.metrics.sentCount,
        openRate: Number(openRate.toFixed(1)),
        clickRate: Number(clickRate.toFixed(1)),
        conversions: camp.metrics.conversionCount,
      };
    });

    // Cart recovery calculation rates
    const totalAbandonedRegistered = await EmailCampaign.countDocuments({ type: 'ABANDONED_CART' });
    const successfulRecoveries = await EmailCampaign.countDocuments({ type: 'ABANDONED_CART', 'metrics.conversionCount': { $gt: 0 } });
    const recoveryRate = totalAbandonedRegistered > 0 ? (successfulRecoveries / totalAbandonedRegistered) * 100 : 0;

    // Attribution models share
    const attributionTrafficShare = await AttributionEvent.aggregate([
      {
        $group: {
          _id: '$source',
          sessionsCount: { $sum: 1 },
          attributionSales: { $sum: { $cond: [{ $ifNull: ['$orderId', false] }, 1, 0] } }
        }
      },
      {
        $project: {
          source: '$_id',
          sessionsCount: 1,
          attributionSales: 1,
        }
      }
    ]);

    return {
      totalCouponRedeemedCount,
      couponUsageStats,
      promotionPerformance,
      campaignStats,
      cartRecoveryRate: Number(recoveryRate.toFixed(1)),
      attributionTrafficShare,
    };
  }

  /**
   * Tracks metric events on an email campaign
   */
  async recordCampaignMetric(campaignId: string, event: 'open' | 'click' | 'conversion'): Promise<void> {
    const camp = await EmailCampaign.findById(campaignId);
    if (!camp) return;

    if (event === 'open') {
      camp.metrics.openCount += 1;
    } else if (event === 'click') {
      camp.metrics.clickCount += 1;
    } else if (event === 'conversion') {
      camp.metrics.conversionCount += 1;
    }

    await camp.save();
  }
}

export const marketingAnalyticsService = new MarketingAnalyticsService();
