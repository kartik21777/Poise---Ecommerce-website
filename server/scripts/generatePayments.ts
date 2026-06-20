import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Order } from '../models/Order.js';
import { PaymentTransaction, PaymentTransactionStatus } from '../models/PaymentTransaction.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const STATUS_DISTRIBUTION = {
  CAPTURED: 0.85,
  PENDING: 0.08,
  FAILED: 0.05,
  REFUNDED: 0.02
};

const getRandomStatus = (): PaymentTransactionStatus => {
  const rand = Math.random();
  let cumulative = 0;
  for (const [status, probability] of Object.entries(STATUS_DISTRIBUTION)) {
    cumulative += probability;
    if (rand < cumulative) return status as PaymentTransactionStatus;
  }
  return 'CAPTURED';
};

export async function seedPayments(shouldExit = false) {
  try {
    console.log('[Payment Seed] Starting generation...');
    const orders = await Order.find().populate('user');
    
    if (orders.length === 0) {
      console.log('[Payment Seed] No orders found. Skipping payment seeding.');
      if (shouldExit) process.exit(0);
      return;
    }

    const transactions = [];
    const gateways = ['STRIPE', 'RAZORPAY'] as const;

    for (const order of orders) {
      const status = getRandomStatus();
      const gateway = gateways[Math.floor(Math.random() * gateways.length)];
      const timestamp = order.createdAt;

      // Realistic Gateway IDs
      const gatewayOrderId = gateway === 'RAZORPAY' ? `order_${Math.random().toString(36).substring(7)}` : `cs_${Math.random().toString(36).substring(7)}`;
      const gatewayPaymentId = gateway === 'RAZORPAY' ? `pay_${Math.random().toString(36).substring(7)}` : `pi_${Math.random().toString(36).substring(7)}`;
      
      transactions.push({
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        order: order._id,
        user: order.user?._id || order.user,
        gateway,
        gatewayOrderId,
        gatewayPaymentId,
        amount: order.total,
        currency: order.currency || 'USD',
        status,
        attemptNumber: status === 'FAILED' ? 2 : 1,
        failureReason: status === 'FAILED' ? 'Insufficient funds or gateway timeout' : undefined,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    // Output JSON for transparency
    const outputPath = path.join(process.cwd(), 'payments_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));

    // Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_payments.js');
    const mongoScript = `
const payments = ${JSON.stringify(transactions, null, 2)};
db.paymenttransactions.insertMany(payments.map(p => ({
  ...p,
  order: ObjectId(p.order),
  user: ObjectId(p.user),
  createdAt: new Date(p.createdAt),
  updatedAt: new Date(p.updatedAt)
})));
console.log('Seeded 500 payment transactions successfully');
`;
    fs.writeFileSync(scriptPath, mongoScript);

    // Seed into DB
    const result = await PaymentTransaction.insertMany(transactions);
    console.log(`[Payment Seed] Successfully seeded ${result.length} transactions.`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[Payment Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

// Only run immediately if this script is executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('generatePayments.ts') || 
  process.argv[1].endsWith('generatePayments.js')
);

if (isDirectRun) {
  connectDB().then(() => seedPayments(true));
}
