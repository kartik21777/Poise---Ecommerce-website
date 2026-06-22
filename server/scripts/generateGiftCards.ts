import { connectDB } from '../config/db.js';
import { GiftCard, GiftCardStatus } from '../models/GiftCard.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const VALUES = [500, 1000, 2500, 5000];
const STATUSES: GiftCardStatus[] = ['ACTIVE', 'REDEEMED', 'EXPIRED'];

const generateCode = (usedCodes: Set<string>) => {
  const chars = '0123456789ABCDEF';
  let code: string;
  do {
    let suffix = '';
    for (let i = 0; i < 8; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `GC-${suffix}`;
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
};

export async function seedGiftCards(shouldExit = false) {
  try {
    console.log('[GiftCard Seed] Starting generation of 100 realistic gift cards...');

    const giftCards = [];
    const now = new Date();
    const usedCodes = new Set<string>();

    for (let i = 0; i < 100; i++) {
        const originalValue = VALUES[Math.floor(Math.random() * VALUES.length)];
        const status = STATUSES[i % STATUSES.length]; // Even distribution for diversity
        
        let balance = originalValue;
        let expirationDate: Date;

        if (status === 'REDEEMED') {
            balance = 0;
            // Redeemed cards can have future or past expiry, let's make it future
            expirationDate = new Date(now.getTime() + (30 + Math.random() * 335) * 24 * 60 * 60 * 1000);
        } else if (status === 'EXPIRED') {
            const isPartial = Math.random() < 0.5;
            if (isPartial) {
                balance = parseFloat((originalValue * (0.1 + Math.random() * 0.8)).toFixed(2));
            }
            expirationDate = new Date(now.getTime() - (1 + Math.random() * 180) * 24 * 60 * 60 * 1000); // 1-180 days past
        } else { // ACTIVE
            const isPartial = Math.random() < 0.3;
            if (isPartial) {
                balance = parseFloat((originalValue * (0.1 + Math.random() * 0.8)).toFixed(2));
            }
            expirationDate = new Date(now.getTime() + (30 + Math.random() * 335) * 24 * 60 * 60 * 1000); // 30-365 days future
        }

        // Final safety check
        if (balance < 0 || balance > originalValue) {
            console.error(`[GiftCard Seed] Invalid balance detected for card ${i}: ${balance} (Value: ${originalValue})`);
            continue;
        }

        giftCards.push({
            code: generateCode(usedCodes),
            originalValue,
            balance,
            currency: 'INR',
            status,
            expirationDate,
            createdAt: now,
            updatedAt: now
        });
    }

    // Output JSON
    const outputPath = path.join(process.cwd(), 'giftcards_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify(giftCards, null, 2));

    // Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_giftcards.js');
    const mongoScript = `
const giftCards = ${JSON.stringify(giftCards, null, 2)};
db.giftcards.insertMany(giftCards.map(g => ({
  ...g,
  expirationDate: new Date(g.expirationDate),
  createdAt: new Date(g.createdAt),
  updatedAt: new Date(g.updatedAt)
})));
console.log('Seeded 100 realistic gift cards successfully');

// Verification checks
const stats = db.giftcards.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 }, avgBalance: { $avg: "$balance" } } }
]).toArray();
console.log('Gift Card Status Statistics:', stats);

const invalidCards = db.giftcards.find({ $or: [ { balance: { $gt: "$originalValue" } }, { balance: { $lt: 0 } } ] }).count();
if (invalidCards > 0) console.error('CRITICAL: Found ' + invalidCards + ' invalid cards with balance > originalValue or balance < 0');
else console.log('✓ All card balances are valid (0 <= balance <= originalValue)');
`;
    fs.writeFileSync(scriptPath, mongoScript);

    // Seed into DB
    const result = await GiftCard.insertMany(giftCards);
    console.log(`[GiftCard Seed] Successfully seeded ${result.length} gift cards.`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[GiftCard Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

// Only run immediately if this script is executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('generateGiftCards.ts') || 
  process.argv[1].endsWith('generateGiftCards.js')
);

if (isDirectRun) {
  connectDB().then(() => seedGiftCards(true));
}
