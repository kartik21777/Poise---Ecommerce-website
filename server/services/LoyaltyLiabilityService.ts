import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { exchangeRateService } from './ExchangeRateService.js';

export interface ILoyaltyLiabilityReport {
  outstandingPoints: number;
  outstandingEstimatedUSDValue: number;
  redeemedPoints: number;
  redeemedUSDValue: number;
  expiredPoints: number;
  expiredUSDValue: number;
  promotionalPointsIssued: number;
  reconciliationAuditMatched: boolean;
  driftValue: number;
}

export class LoyaltyLiabilityService {
  /**
   * Section 1.6 & 9 — Calculates overall loyalty liabilities directly from ledger transaction books.
   */
  async generateLiabilityReport(): Promise<ILoyaltyLiabilityReport> {
    const rates = await exchangeRateService.getLatestRates();

    // 1. Calculate running sum of outstanding points from ledger blocks
    const outstandingAggr = await LoyaltyTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' },
        },
      },
    ]);
    const outstandingPoints = outstandingAggr[0]?.totalPoints || 0;

    // 2. Sum of redeemed points
    const redeemedAggr = await LoyaltyTransaction.aggregate([
      { $match: { type: LoyaltyTxType.REDEEM } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' }, // negative, flip it
          estimatedUSDValue: { $sum: '$pointsValueInCurrency' }, // negative, flip it
        },
      },
    ]);
    const redeemedPoints = Math.abs(redeemedAggr[0]?.totalPoints || 0);
    const redeemedUSDValue = Math.abs(redeemedAggr[0]?.estimatedUSDValue || 0);

    // 3. Sum of expired points
    const expiredAggr = await LoyaltyTransaction.aggregate([
      { $match: { type: LoyaltyTxType.EXPIRATION } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' }, // negative
          estimatedUSDValue: { $sum: '$pointsValueInCurrency' }, // negative
        },
      },
    ]);
    const expiredPoints = Math.abs(expiredAggr[0]?.totalPoints || 0);
    const expiredUSDValue = Math.abs(expiredAggr[0]?.estimatedUSDValue || 0);

    // 4. Sum of promotional points
    const promoAggr = await LoyaltyTransaction.aggregate([
      { $match: { isPromotional: true, amount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' },
        },
      },
    ]);
    const promotionalPointsIssued = promoAggr[0]?.totalPoints || 0;

    // 5. Audit drift - compare ledger sums against fast LoyaltyAccount cache values
    const accountsAggr = await LoyaltyAccount.aggregate([
      {
        $group: {
          _id: null,
          totalCachedPoints: { $sum: '$pointsBalance' },
        },
      },
    ]);
    const totalCachedPoints = accountsAggr[0]?.totalCachedPoints || 0;
    const reconciliationAuditMatched = outstandingPoints === totalCachedPoints;
    const driftValue = totalCachedPoints - outstandingPoints;

    // Outstanding Value estimate (assuming 100 points = 1 USD as default, or based on the active valuation policy)
    // We can fetch latest valuation policy
    const { LoyaltyValuationPolicy } = await import('../models/LoyaltyValuationPolicy.js');
    let latestPolicy = await LoyaltyValuationPolicy.findOne().sort({ versionNumber: -1 });
    if (!latestPolicy) {
      latestPolicy = await LoyaltyValuationPolicy.create({
        versionNumber: 1,
        pointValueInUSD: 0.01,
        currency: 'USD',
        effectiveFrom: new Date(),
        notes: 'Initial automatic bootstrap valuation policy.',
      });
    }
    const outstandingEstimatedUSDValue = outstandingPoints * latestPolicy.pointValueInUSD;

    return {
      outstandingPoints,
      outstandingEstimatedUSDValue,
      redeemedPoints,
      redeemedUSDValue,
      expiredPoints,
      expiredUSDValue,
      promotionalPointsIssued,
      reconciliationAuditMatched,
      driftValue,
    };
  }
}

export const loyaltyLiabilityService = new LoyaltyLiabilityService();
