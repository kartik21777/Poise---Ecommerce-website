import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { StoreCreditAccount } from '../models/StoreCreditAccount.js';
import { StoreCreditTransaction, StoreCreditTransactionType } from '../models/StoreCreditTransaction.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TRANSACTION_TYPES: { type: StoreCreditTransactionType, prob: number }[] = [
  { type: 'CREDIT_LOAD', prob: 0.40 },
  { type: 'REFUND_CREDIT', prob: 0.25 },
  { type: 'DEBIT_SPEND', prob: 0.30 },
  { type: 'ADJUSTMENT', prob: 0.05 }
];

const getRandomType = (): StoreCreditTransactionType => {
  const rand = Math.random();
  let cumulative = 0;
  for (const t of TRANSACTION_TYPES) {
    cumulative += t.prob;
    if (rand < cumulative) return t.type;
  }
  return 'CREDIT_LOAD';
};

export async function seedStoreCredit(shouldExit = false) {
  try {
    console.log('[Store Credit Seed] Starting generation for 30 accounts and 500 transactions...');

    const users = await User.find().limit(50); // Get a pool of users
    if (users.length < 30) {
      console.error('[Store Credit Seed] Not enough users found. Please seed users first.');
      if (shouldExit) process.exit(1);
      return;
    }

    // Select 30 random users
    const selectedUsers = users.sort(() => 0.5 - Math.random()).slice(0, 30);
    const accountRecords = [];
    const transactionRecords = [];
    
    // Group transactions by account for reconciliation and ordering
    const accountsData: any[] = [];

    let totalTransactionsGenerated = 0;
    const targetTransactions = 500;

    for (let i = 0; i < selectedUsers.length; i++) {
        const user = selectedUsers[i];
        
        // 1. Check for existing account
        let account = await StoreCreditAccount.findOne({ user: user._id });
        let isNewAccount = false;
        
        if (!account) {
            isNewAccount = true;
            account = new StoreCreditAccount({
                user: user._id,
                currency: 'INR',
                balance: 0,
                isEnabled: true
            });
        }

        // 2. Determine number of transactions for this account
        // Distribute 500 roughly evenly, but with some variation
        let numTransactions = Math.floor(targetTransactions / selectedUsers.length);
        if (i === selectedUsers.length - 1) {
            numTransactions = targetTransactions - totalTransactionsGenerated;
        } else {
            numTransactions += Math.floor(Math.random() * 5) - 2; // +/- 2 variation
        }
        numTransactions = Math.max(1, numTransactions);
        totalTransactionsGenerated += numTransactions;

        // 3. Generate Transactions
        const accountTransactions = [];
        let runningBalance = account.balance;
        let minRunningBalance = runningBalance;
        let lastDate = account.createdAt || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000); // 180 days ago

        for (let j = 0; j < numTransactions; j++) {
            let type = getRandomType();
            
            // First transaction for a new/empty account must be a credit
            if (runningBalance === 0 && (type === 'DEBIT_SPEND' || (type === 'ADJUSTMENT' && Math.random() < 0.3))) {
                type = Math.random() < 0.6 ? 'CREDIT_LOAD' : 'REFUND_CREDIT';
            }

            let amount: number;
            if (type === 'CREDIT_LOAD' || type === 'REFUND_CREDIT') {
                amount = parseFloat((100 + Math.random() * 5000).toFixed(2));
            } else if (type === 'DEBIT_SPEND') {
                // Spend 10-80% of current balance
                amount = -parseFloat((runningBalance * (0.1 + Math.random() * 0.7)).toFixed(2));
            } else { // ADJUSTMENT
                const isPositive = Math.random() < 0.7;
                if (isPositive) {
                    amount = parseFloat((50 + Math.random() * 500).toFixed(2));
                } else {
                    // Negative adjustment: cap by balance
                    amount = -parseFloat((Math.min(runningBalance, 50 + Math.random() * 500)).toFixed(2));
                }
            }

            // Financial Safeguard: Never dip below zero
            if (runningBalance + amount < 0) {
                amount = -runningBalance; // Drain to zero instead of going negative
            }

            runningBalance = parseFloat((runningBalance + amount).toFixed(2));
            minRunningBalance = Math.min(minRunningBalance, runningBalance);

            // Chronological Ordering
            const dateIncrement = (1 + Math.random() * 5) * 24 * 60 * 60 * 1000; // 1-5 days later
            const transactionDate = new Date(lastDate.getTime() + dateIncrement);
            lastDate = transactionDate;

            accountTransactions.push({
                account: account._id,
                type,
                amount,
                currency: account.currency,
                transactionDate,
                notes: `System generated ${type.toLowerCase()} for seeding`,
                createdAt: transactionDate,
                updatedAt: transactionDate
            });
        }

        // 4. Audit Replay Verification
        const sumTransactions = accountTransactions.reduce((acc, t) => acc + t.amount, 0);
        const expectedFinalBalance = parseFloat((account.balance + sumTransactions).toFixed(2));
        
        if (expectedFinalBalance !== runningBalance) {
            console.error(`[Store Credit Seed] Audit failed for user ${user._id}. Expected: ${expectedFinalBalance}, Replayed: ${runningBalance}`);
        }

        if (minRunningBalance < 0) {
            console.error(`[Store Credit Seed] Negative balance safety violation for user ${user._id}. Min: ${minRunningBalance}`);
        }

        // Update account balance
        account.balance = runningBalance;
        
        accountRecords.push(account);
        transactionRecords.push(...accountTransactions);
    }

    console.log(`[Store Credit Seed] Generated ${accountRecords.length} accounts and ${transactionRecords.length} transactions.`);

    // Output JSON
    const outputPath = path.join(process.cwd(), 'storecredit_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify({ accounts: accountRecords, transactions: transactionRecords }, null, 2));

    // Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_storecredit.js');
    const mongoScript = `
const data = ${JSON.stringify({ accounts: accountRecords, transactions: transactionRecords }, null, 2)};

// 1. Upsert Accounts
data.accounts.forEach(acc => {
  db.storecreditaccounts.updateOne(
    { user: ObjectId(acc.user), currency: acc.currency },
    { $set: { 
        balance: acc.balance, 
        isEnabled: acc.isEnabled,
        updatedAt: new Date()
    } },
    { upsert: true }
  );
});

// 2. Clear then Insert Transactions (to avoid duplicates if re-run)
const accountIds = data.accounts.map(a => ObjectId(a._id));
db.storecredittransactions.deleteMany({ account: { $in: accountIds } });
db.storecredittransactions.insertMany(data.transactions.map(t => ({
  ...t,
  account: ObjectId(t.account),
  transactionDate: new Date(t.transactionDate),
  createdAt: new Date(t.createdAt),
  updatedAt: new Date(t.updatedAt)
})));

console.log('Seeded Store Credit data successfully');

// 3. Analytical Validation
const stats = db.storecredittransactions.aggregate([
  {
    $group: {
      _id: "$type",
      totalAmount: { $sum: "$amount" },
      count: { $sum: 1 }
    }
  }
]).toArray();
console.log('Transaction Mix Statistics:', stats);

// 4. Reconciliation Verification
data.accounts.forEach(acc => {
    const accId = ObjectId(acc._id);
    const sum = db.storecredittransactions.aggregate([
        { $match: { account: accId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray()[0]?.total || 0;
    
    // Note: Due to floating point math in MongoDB $sum vs JS, we check for near equality
    if (Math.abs(sum - (acc.balance - 0)) > 0.01) {
        console.error('Mismatch for account ' + acc._id + ': Ledger Sum=' + sum + ', Account Balance=' + acc.balance);
    }
});
`;
    fs.writeFileSync(scriptPath, mongoScript);

    // Seed into DB
    // Use bulkWrite for accounts to handle existing records
    const accountOps = accountRecords.map(acc => ({
        updateOne: {
            filter: { user: acc.user, currency: acc.currency },
            update: { $set: { balance: acc.balance, isEnabled: acc.isEnabled } },
            upsert: true
        }
    }));
    await StoreCreditAccount.bulkWrite(accountOps);

    // Re-fetch account IDs if they were upserted (so we link transactions correctly)
    // Actually, in our generator we used account._id which we generated or fetched.
    // If it was a new unsaved model, it already has an _id.
    
    await StoreCreditTransaction.insertMany(transactionRecords);
    console.log(`[Store Credit Seed] DB Seeding completed successfully.`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[Store Credit Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

// Only run immediately if this script is executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('generateStoreCredit.ts') || 
  process.argv[1].endsWith('generateStoreCredit.js')
);

if (isDirectRun) {
  connectDB().then(() => seedStoreCredit(true));
}
