import { connectDB } from '../config/db.js';
import { Order } from '../models/Order.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { RefundTransaction, RefundTransactionStatus } from '../models/RefundTransaction.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const REASON_DISTRIBUTION = [
  { reason: "Customer changed mind", probability: 0.30 },
  { reason: "Damaged item", probability: 0.15 },
  { reason: "Wrong item received", probability: 0.15 },
  { reason: "Product defective", probability: 0.15 },
  { reason: "Late delivery", probability: 0.10 },
  { reason: "Duplicate order", probability: 0.05 },
  { reason: "Fraudulent transaction", probability: 0.05 },
  { reason: "Inventory issue", probability: 0.05 }
];

const STATUS_DISTRIBUTION = [
  { status: 'COMPLETED' as RefundTransactionStatus, probability: 0.85 },
  { status: 'REQUESTED' as RefundTransactionStatus, probability: 0.10 },
  { status: 'FAILED' as RefundTransactionStatus, probability: 0.05 }
];

const getRandomItem = <T>(distribution: { probability: number }[]): T => {
  const rand = Math.random();
  let cumulative = 0;
  for (const item of distribution) {
    cumulative += item.probability;
    if (rand < cumulative) return item as unknown as T;
  }
  return distribution[0] as unknown as T;
};

const getRandomReason = () => (getRandomItem<{ reason: string }>(REASON_DISTRIBUTION)).reason;
const getRandomStatus = () => (getRandomItem<{ status: RefundTransactionStatus }>(STATUS_DISTRIBUTION)).status;

const generateRefundId = () => `REF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

export async function seedRefunds(shouldExit = false) {
  try {
    console.log('[Refund Seed] Starting generation...');

    // 1. Fetch successful PaymentTransactions
    const capturedPayments = await PaymentTransaction.find({ status: 'CAPTURED' });
    
    if (capturedPayments.length === 0) {
      console.log('[Refund Seed] No successful payment transactions found. Please seed payments first.');
      if (shouldExit) process.exit(0);
      return;
    }

    // 2. Fetch all existing refunds for idempotency safeguard
    const existingRefunds = await RefundTransaction.find();
    const refundTotalsMap: Record<string, number> = {};
    existingRefunds.forEach(r => {
      const pid = r.paymentTransaction.toString();
      refundTotalsMap[pid] = (refundTotalsMap[pid] || 0) + r.amount;
    });

    // 3. Exclude payments that have already been fully refunded
    const refundablePayments = capturedPayments.filter(p => (refundTotalsMap[p._id.toString()] || 0) < p.amount);

    console.log(`[Refund Seed] Found ${capturedPayments.length} captured payments, ${refundablePayments.length} are refundable.`);

    if (refundablePayments.length === 0) {
      console.log('[Refund Seed] No refundable payments available.');
      if (shouldExit) process.exit(0);
      return;
    }

    // 4. Select a subset (10-20%)
    const subsetSize = Math.max(1, Math.floor(refundablePayments.length * (0.1 + Math.random() * 0.1)));
    const selectedPayments = refundablePayments.sort(() => 0.5 - Math.random()).slice(0, subsetSize);

    console.log(`[Refund Seed] Generating refunds for ${selectedPayments.length} transactions...`);

    const refundRecords = [];
    const orderUpdates = [];

    for (const payment of selectedPayments) {
      const isFullRefund = Math.random() < 0.7; // 70% Full
      const currentRefunded = refundTotalsMap[payment._id.toString()] || 0;
      const maxPossible = payment.amount - currentRefunded;
      
      let amount: number;
      if (isFullRefund) {
        amount = maxPossible;
      } else {
        // Partial: 10-50% of the ORIGINAL payment amount, capped by maxPossible
        const partialPercent = 0.1 + Math.random() * 0.4;
        amount = Math.min(maxPossible, parseFloat((payment.amount * partialPercent).toFixed(2)));
      }

      const status = getRandomStatus();
      const createdAt = new Date(payment.createdAt.getTime() + (1 + Math.random() * 29) * 24 * 60 * 60 * 1000); // 1-30 days later

      const refundRecord = {
        refundId: generateRefundId(),
        order: payment.order,
        paymentTransaction: payment._id,
        amount,
        currency: payment.currency,
        exchangeRateUsed: 1, // Assuming 1 for now or as per payment
        reason: getRandomReason(),
        status,
        gatewayRefundId: `ref_gateway_${Math.random().toString(36).substring(7)}`,
        gatewayRefundAmount: status === 'COMPLETED' ? amount : 0,
        createdAt,
        updatedAt: createdAt
      };

      refundRecords.push(refundRecord);

      // Order Status Sync: Only update Order.status to REFUNDED if it's a Full AND COMPLETED refund
      if (isFullRefund && status === 'COMPLETED') {
        orderUpdates.push({
          updateOne: {
            filter: { _id: payment.order },
            update: { $set: { status: 'REFUNDED', paymentStatus: 'REFUNDED' } }
          }
        });
      }
    }

    // 5. Output JSON for transparency
    const outputPath = path.join(process.cwd(), 'refunds_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify(refundRecords, null, 2));

    // 6. Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_refunds.js');
    const mongoScript = `
const refunds = ${JSON.stringify(refundRecords, null, 2)};
db.refundtransactions.insertMany(refunds.map(r => ({
  ...r,
  order: ObjectId(r.order),
  paymentTransaction: ObjectId(r.paymentTransaction),
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt)
})));
console.log('Seeded ' + refunds.length + ' refund transactions successfully');

// Run order updates
${orderUpdates.length > 0 ? `db.orders.bulkWrite(${JSON.stringify(orderUpdates, null, 2)}.map(u => ({
  updateOne: {
    filter: { _id: ObjectId(u.updateOne.filter._id) },
    update: u.updateOne.update
  }
})));` : '// No order updates needed'}
`;
    fs.writeFileSync(scriptPath, mongoScript);

    // 7. Seed into DB
    const result = await RefundTransaction.insertMany(refundRecords);
    if (orderUpdates.length > 0) {
      await Order.bulkWrite(orderUpdates);
    }

    console.log(`[Refund Seed] Successfully seeded ${result.length} refund transactions.`);
    console.log(`[Refund Seed] Successfully updated ${orderUpdates.length} orders to REFUNDED status.`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[Refund Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

// Only run immediately if this script is executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('generateRefunds.ts') || 
  process.argv[1].endsWith('generateRefunds.js')
);

if (isDirectRun) {
  connectDB().then(() => seedRefunds(true));
}
