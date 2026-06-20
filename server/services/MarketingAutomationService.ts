import mongoose from 'mongoose';
import { MarketingPreference } from '../models/MarketingPreference.js';
import { EmailCampaign, IEmailCampaign } from '../models/EmailCampaign.js';
import { AttributionEvent } from '../models/AttributionEvent.js';
import { Experiment } from '../models/Experiment.js';
import { ExperimentAssignment } from '../models/ExperimentAssignment.js';
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const log = logger('MarketingAutomationService');

export class MarketingAutomationService {
  /**
   * SECTION 6 — ABANDONED CART RECOVERY
   * Detects abandoned carts (updated >30 minutes ago, no order placed since)
   * Generates campaign recovery data with tracking links.
   */
  async generateAbandonedCartRecoveryCampaigns(): Promise<number> {
    const thresholdDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const pipeline = [
      {
        $match: {
          updatedAt: { $lte: thresholdDate },
          'items.0': { $exists: true },
          user: { $exists: true, $ne: null }
        }
      },
      // 1. Lookup Marketing Consent
      {
        $lookup: {
          from: mongoose.model('MarketingPreference').collection.name,
          localField: 'user',
          foreignField: 'userId',
          as: 'consent'
        }
      },
      {
        $match: {
          $or: [
            { 'consent': { $size: 0 } },
            { 'consent.emailOptIn': true }
          ]
        }
      },
      // 2. Lookup Orders placed after cart update
      {
        $lookup: {
          from: mongoose.model('Order').collection.name,
          let: { cartUserId: '$user', cartUpdatedAt: '$updatedAt' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$user', '$$cartUserId'] },
                    { $gte: ['$createdAt', '$$cartUpdatedAt'] }
                  ]
                }
              }
            },
            { $limit: 1 }
          ],
          as: 'subsequentOrders'
        }
      },
      {
        $match: {
          'subsequentOrders': { $size: 0 }
        }
      },
      // 3. Lookup User details
      {
        $lookup: {
          from: mongoose.model('User').collection.name,
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          userId: '$user',
          updatedAt: 1,
          userName: '$userDetails.name',
          userEmail: '$userDetails.email'
        }
      }
    ];

    const inactiveCarts = await mongoose.model('Cart').aggregate(pipeline);

    if (inactiveCarts.length === 0) return 0;

    const runTimestamp = Date.now();
    const bulks: Array<Record<string, unknown>> = [];
    
    // We fetch existing email campaigns for these carts to avoid duplicates.
    // The previous implementation used Date.now() in the name, causing endless duplicate spam.
    // We'll scope uniqueness by cart updated timestamp.
    for (const cart of inactiveCarts) {
      const recoveryToken = Buffer.from(`${cart.userId.toString()}-${cart._id.toString()}`).toString('base64');
      const recoveryLink = `https://ais-dev-xdxvreqcswau6xr7o5tsa3-933160400103.asia-east1.run.app/cart/recover?token=${recoveryToken}&utm_source=abandoned_cart&utm_medium=email&utm_campaign=cart_recovery_pulse`;

      const campaignName = `Cart Recover - User ${cart.userEmail} - CartState ${cart.updatedAt.getTime()}`;

      bulks.push({
        updateOne: {
          filter: { name: campaignName },
          update: {
            $setOnInsert: {
              name: campaignName,
              type: 'ABANDONED_CART',
              subject: 'Complete your purchase! items are waiting in your cart',
              bodyTemplate: `Hi ${cart.userName || 'Shopper'},\n\nWe noticed you left some items in your cart. Retrieve them here: ${recoveryLink}`,
              status: 'SCHEDULED',
              scheduledAt: new Date(),
            }
          },
          upsert: true
        }
      });
    }

    if (bulks.length > 0) {
      const result = await EmailCampaign.collection.bulkWrite(bulks as unknown as Parameters<typeof EmailCampaign.collection.bulkWrite>[0], { ordered: false });
      return result.upsertedCount || 0;
    }

    return 0;
  }

  /**
   * SECTION 7.5 — MARKETING CONSENT MANAGEMENT
   * Create or update marketing preferences
   */
  async updateConsent(
    userId: string,
    emailOptIn: boolean,
    smsOptIn: boolean,
    pushOptIn: boolean,
    consentSource: string = 'CHECKOUT'
  ) {
    const userObjId = new mongoose.Types.ObjectId(userId);
    
    const pref = await MarketingPreference.findOneAndUpdate(
      { userId: userObjId },
      {
        emailOptIn,
        smsOptIn,
        pushOptIn,
        consentTimestamp: new Date(),
        consentSource
      },
      { upsert: true, new: true }
    );

    log.info(`Updated marketing consent: user=${userId}, email=${emailOptIn}`);
    return pref;
  }

  /**
   * SECTION 9 — ATTRIBUTION TRACKING & DEDUPLICATION
   */
  async trackAttribution(
    visitorId: string,
    source: string,
    medium?: string,
    campaign?: string,
    referral?: string,
    landingPage?: string,
    userId?: string
  ): Promise<boolean> {
    if (!visitorId || !source) return false;

    // Deduplication check: prevent logging multiple duplicate attributions within 3 minutes interval
    const threeMinsAgo = new Date(Date.now() - 3 * 60 * 1000);
    const recentDuplicate = await AttributionEvent.findOne({
      visitorId,
      source,
      campaign: campaign || null,
      createdAt: { $gte: threeMinsAgo }
    });

    if (recentDuplicate) {
      log.info(`Deduplicated attribution event for visitorId: ${visitorId}`);
      return false;
    }

    const event = new AttributionEvent({
      visitorId,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      source,
      medium,
      campaign,
      referral,
      landingPage
    });

    await event.save();
    return true;
  }

  /**
   * SECTION 9.5 — ATTRIBUTION RESOLUTION
   * Resolves attribution for an order using first-touch or last-touch model
   */
  async resolveOrderAttribution(orderId: string, visitorId: string, model: 'FIRST' | 'LAST' = 'LAST'): Promise<unknown> {
    const orderObjId = new mongoose.Types.ObjectId(orderId);
    
    // Find all attribution events for visitorId prior to or matching checkout timestamp
    const attributions = await AttributionEvent.find({ visitorId, orderId: { $exists: false } })
      .sort({ createdAt: model === 'FIRST' ? 1 : -1 });

    if (attributions.length === 0) return null;

    const winner = attributions[0];
    winner.orderId = orderObjId;
    await winner.save();

    log.info(`Attributed orderId=${orderId} to campaign=${winner.campaign} (source=${winner.source}) via ${model}-touch`);
    return winner;
  }

  /**
   * SECTION 10 — A/B TESTING & EXPERIMENT ASSIGNMENT
   * Selects deterministic variant bucket for user fingerprint (visitorId)
   */
  async assignUserToExperiment(experimentName: string, visitorId: string, userId?: string): Promise<string> {
    const experiment = await Experiment.findOne({ name: experimentName });
    if (!experiment || experiment.status !== 'ACTIVE') {
      return 'CONTROL'; // Fallback control bucket
    }

    // Check with assignment uniqueness ledger to guarantee exact sticky assignment
    const existing = await ExperimentAssignment.findOne({
      experimentId: experiment._id,
      visitorId
    });

    if (existing) {
      return existing.variant;
    }

    // Determine bucket deterministically based on hash of experimentId + visitorId
    const combo = `${experiment._id.toString()}-${visitorId}`;
    let hash = 0;
    for (let i = 0; i < combo.length; i++) {
      hash = combo.charCodeAt(i) + ((hash << 5) - hash);
    }
    const bucketIndex = Math.abs(hash) % experiment.variants.length;
    const selectedVariant = experiment.variants[bucketIndex];

    const assignment = new ExperimentAssignment({
      experimentId: experiment._id,
      experimentName: experiment.name,
      userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      visitorId,
      variant: selectedVariant,
    });

    await assignment.save();
    return selectedVariant;
  }
}

export const marketingAutomationService = new MarketingAutomationService();
