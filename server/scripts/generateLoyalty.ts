import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { LoyaltyAccount, LoyaltyTier } from '../models/LoyaltyAccount.js';
import { LoyaltyTransaction, LoyaltyTxType } from '../models/LoyaltyTransaction.js';
import { LoyaltyTierConfig } from '../models/LoyaltyTierConfig.js';
import { LoyaltyValuationPolicy } from '../models/LoyaltyValuationPolicy.js';
import { ReferralProgram } from '../models/ReferralProgram.js';
import { ReferralRewardTransaction, ReferralRewardTxType } from '../models/ReferralRewardTransaction.js';
import { TierHistory } from '../models/TierHistory.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TIER_THRESHOLDS = {
  [LoyaltyTier.BRONZE]: 0,
  [LoyaltyTier.SILVER]: 10000,
  [LoyaltyTier.GOLD]: 50000,
  [LoyaltyTier.PLATINUM]: 100000
};

const TX_TYPES: { type: LoyaltyTxType, prob: number }[] = [
  { type: LoyaltyTxType.EARN, prob: 0.65 },
  { type: LoyaltyTxType.REDEEM, prob: 0.20 },
  { type: LoyaltyTxType.REFERRAL_REWARD, prob: 0.10 },
  { type: LoyaltyTxType.ADJUSTMENT, prob: 0.05 }
];

const getRandomTxType = (): LoyaltyTxType => {
  const rand = Math.random();
  let cumulative = 0;
  for (const t of TX_TYPES) {
    cumulative += t.prob;
    if (rand < cumulative) return t.type;
  }
  return LoyaltyTxType.EARN;
};

const generateReferralCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export async function seedLoyalty(shouldExit = false) {
  try {
    console.log('[Loyalty Seed] Starting generation for 50 users and 500+ transactions...');

    const users = await User.find().limit(100);
    if (users.length < 50) {
      console.error('[Loyalty Seed] Not enough users found. Please seed users first.');
      if (shouldExit) process.exit(1);
      return;
    }

    // 1. Ensure Config exists
    const configs = await LoyaltyTierConfig.find();
    if (configs.length === 0) {
      await LoyaltyTierConfig.insertMany(Object.keys(TIER_THRESHOLDS).map(tier => ({
        tier,
        qualificationThresholdPoints: TIER_THRESHOLDS[tier as LoyaltyTier],
        retentionThresholdPoints: TIER_THRESHOLDS[tier as LoyaltyTier] * 0.8,
        earningMultiplier: tier === 'PLATINUM' ? 2 : tier === 'GOLD' ? 1.5 : tier === 'SILVER' ? 1.2 : 1
      })));
    }
    
    if (!(await LoyaltyValuationPolicy.findOne())) {
      await LoyaltyValuationPolicy.create({ versionNumber: 1, pointValueInUSD: 0.01, currency: 'USD', effectiveFrom: new Date() });
    }

    const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, 50);
    const accounts: any[] = [];
    const transactions: any[] = [];
    const tierHistories: any[] = [];
    const referrals: any[] = [];
    const referralRewardTxs: any[] = [];

    const referringPool = selectedUsers.slice(0, 10); // First 10 users are potential referrers
    const referredPool = selectedUsers.slice(10); // Rest are referred or neutral

    for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        if (await LoyaltyAccount.findOne({ userId: user._id })) continue;

        const account = {
            _id: new mongoose.Types.ObjectId(),
            userId: user._id,
            pointsBalance: 0,
            lifetimeEarned: 0,
            lifetimeRedeemed: 0,
            currentTier: LoyaltyTier.BRONZE,
            referralCode: generateReferralCode() + i, // Unique enough for seeding
            createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
            updatedAt: new Date()
        };

        const accountTxs = [];
        const accountTierHistory = [];
        let runningBalance = 0;
        let lifetimeEarned = 0;
        let lifetimeRedeemed = 0;
        let currentTier = LoyaltyTier.BRONZE;
        let lastTxDate = account.createdAt;

        // Referral Program Setup (if referred by someone)
        let referralProgram: any = null;
        if (i >= 10 && Math.random() < 0.3) {
            const referrer = referringPool[Math.floor(Math.random() * referringPool.length)];
            if (referrer._id.toString() !== user._id.toString()) {
                referralProgram = {
                    _id: new mongoose.Types.ObjectId(),
                    referrerUserId: referrer._id,
                    referredUserId: user._id,
                    referralCode: 'REF-' + referrer._id.toString().substring(0, 5).toUpperCase(),
                    status: 'PENDING',
                    createdAt: new Date(account.createdAt.getTime() + 1000),
                    updatedAt: new Date(account.createdAt.getTime() + 1000)
                };
                referrals.push(referralProgram);
            }
        }

        const numTxs = 5 + Math.floor(Math.random() * 15);
        for (let j = 0; j < numTxs; j++) {
            let type = getRandomTxType();
            
            // First tx or zero balance must be EARN or REFERRAL
            if (runningBalance === 0 && (type === LoyaltyTxType.REDEEM || (type === LoyaltyTxType.ADJUSTMENT && Math.random() < 0.4))) {
                type = LoyaltyTxType.EARN;
            }

            // Referral Reward Timing Check
            if (type === LoyaltyTxType.REFERRAL_REWARD && !referralProgram) {
                type = LoyaltyTxType.EARN;
            }

            let amount: number;
            if (type === LoyaltyTxType.EARN || type === LoyaltyTxType.REFERRAL_REWARD) {
                amount = Math.floor(500 + Math.random() * 5000);
            } else if (type === LoyaltyTxType.REDEEM) {
                amount = -Math.floor(runningBalance * (0.1 + Math.random() * 0.8));
            } else { // ADJUSTMENT
                const isPos = Math.random() < 0.7;
                amount = isPos ? Math.floor(100 + Math.random() * 1000) : -Math.floor(Math.min(runningBalance, 100 + Math.random() * 1000));
            }

            // Chronological Ordering
            const dateInc = (1 + Math.random() * 10) * 24 * 60 * 60 * 1000;
            const transactionDate = new Date(lastTxDate.getTime() + dateInc);
            lastTxDate = transactionDate;

            runningBalance += amount;
            
            // Lifetime Tracking
            if (amount > 0) lifetimeEarned += amount;
            else lifetimeRedeemed += Math.abs(amount);

            accountTxs.push({
                loyaltyAccountId: account._id,
                type,
                amount,
                runningBalance,
                pointsValueInCurrency: amount * 0.01,
                currency: 'USD',
                issuedDate: transactionDate,
                createdAt: transactionDate,
                isPromotional: false
            });

            // Referral Reward Pairing
            if (type === LoyaltyTxType.REFERRAL_REWARD && referralProgram && referralProgram.status === 'PENDING') {
                referralProgram.status = 'REWARDED';
                referralProgram.updatedAt = transactionDate;
                referralRewardTxs.push({
                    referralId: referralProgram._id,
                    userId: user._id,
                    type: ReferralRewardTxType.LOYALTY_BONUS,
                    amount: amount,
                    currency: 'USD',
                    createdAt: transactionDate
                });
            }

            // Monotonic Tier Migration
            let newTier = currentTier;
            if (lifetimeEarned >= TIER_THRESHOLDS[LoyaltyTier.PLATINUM]) newTier = LoyaltyTier.PLATINUM;
            else if (lifetimeEarned >= TIER_THRESHOLDS[LoyaltyTier.GOLD]) newTier = LoyaltyTier.GOLD;
            else if (lifetimeEarned >= TIER_THRESHOLDS[LoyaltyTier.SILVER]) newTier = LoyaltyTier.SILVER;

            if (newTier !== currentTier) {
                tierHistories.push({
                    loyaltyAccountId: account._id,
                    previousTier: currentTier,
                    newTier: newTier,
                    reason: 'Threshold milestone reached',
                    timestamp: transactionDate
                });
                currentTier = newTier;
            }
        }

        // Final reconciliation
        account.pointsBalance = runningBalance;
        account.lifetimeEarned = lifetimeEarned;
        account.lifetimeRedeemed = lifetimeRedeemed;
        account.currentTier = currentTier;

        accounts.push(account);
        transactions.push(...accountTxs);
    }

    console.log(`[Loyalty Seed] Generated: ${accounts.length} Accounts, ${transactions.length} Ledger Txs, ${tierHistories.length} Tier History logs, ${referrals.length} Referrals.`);

    // Outputs
    const payload = { accounts, transactions, tierHistories, referrals, referralRewardTxs };
    fs.writeFileSync(path.join(process.cwd(), 'loyalty_payload.json'), JSON.stringify(payload, null, 2));

    const mongoScript = `
const data = ${JSON.stringify(payload, null, 2)};
db.loyaltyaccounts.insertMany(data.accounts.map(a => ({ ...a, userId: ObjectId(a.userId), createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) })));
db.loyaltytransactions.insertMany(data.transactions.map(t => ({ ...t, loyaltyAccountId: ObjectId(t.loyaltyAccountId), issuedDate: new Date(t.issuedDate), createdAt: new Date(t.createdAt) })));
if (data.tierHistories.length) db.tierhistories.insertMany(data.tierHistories.map(h => ({ ...h, loyaltyAccountId: ObjectId(h.loyaltyAccountId), timestamp: new Date(h.timestamp) })));
if (data.referrals.length) db.referralprograms.insertMany(data.referrals.map(r => ({ ...r, referrerUserId: ObjectId(r.referrerUserId), referredUserId: ObjectId(r.referredUserId), createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) })));
if (data.referralRewardTxs.length) db.referralrewardtransactions.insertMany(data.referralRewardTxs.map(r => ({ ...r, referralId: ObjectId(r.referralId), userId: ObjectId(r.userId), createdAt: new Date(r.createdAt) })));
console.log('Seeded Loyalty & Referral data successfully');
`;
    fs.writeFileSync(path.join(process.cwd(), 'seed_loyalty.js'), mongoScript);

    // DB Seeding
    await LoyaltyAccount.insertMany(accounts);
    await LoyaltyTransaction.insertMany(transactions);
    if (tierHistories.length) await TierHistory.insertMany(tierHistories);
    if (referrals.length) await ReferralProgram.insertMany(referrals);
    if (referralRewardTxs.length) await ReferralRewardTransaction.insertMany(referralRewardTxs);

    console.log('[Loyalty Seed] DB insertion complete.');
    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[Loyalty Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

if (process.argv[1]?.endsWith('generateLoyalty.ts')) {
  connectDB().then(() => seedLoyalty(true));
}
