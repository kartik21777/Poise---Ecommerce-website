import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { seedAdmin } from '../scripts/seedAdmin.js';
import { seedProducts } from '../scripts/seedProducts.js';
import { seedUsers } from '../scripts/seedUsers.js';
import { seedCurrency } from '../scripts/seedCurrency.js';
import { seedOrders } from '../scripts/generateOrders.js';
import { seedPayments } from '../scripts/generatePayments.js';
import { seedGiftCards } from '../scripts/generateGiftCards.js';
import { seedStoreCredit } from '../scripts/generateStoreCredit.js';
import { seedLoyalty } from '../scripts/generateLoyalty.js';
import { env } from './env.js';
import { Order } from '../models/Order.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { GiftCard } from '../models/GiftCard.js';
import { StoreCreditAccount } from '../models/StoreCreditAccount.js';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';

export const runAutoSeeding = async () => {
  try {
    console.log('[System] Verifying database seeding status...');

    // Always ensure INR is set up as the base currency for India
    await seedCurrency();

    const categoryCount = await Category.countDocuments();
    const userCount = await User.countDocuments();

    // Seed initial product catalog and categories if empty
    if (categoryCount === 0) {
      console.log('[System] Blank database detected. Auto-seeding 15 categories and 100 products...');
      await seedProducts(false);
    }

    if (userCount < 5) {
      console.log('[System] Minimal user base detected. Auto-seeding 1 Admin and 50 rich Customer profiles...');
      await seedUsers(false);
    }

    // Seed Demo Orders if enabled and database has no orders
    const orderCount = await Order.countDocuments();
    if (env.enableDemoData && orderCount === 0) {
      console.log('[System] ENABLE_DEMO_DATA is true. Generating 500 realistic orders...');
      await seedOrders(false);
    }

    // Seed Demo Payments if enabled and database has no transactions
    const paymentCount = await PaymentTransaction.countDocuments();
    if (env.enableDemoData && paymentCount === 0) {
      console.log('[System] ENABLE_DEMO_DATA is true. Generating 500 realistic payment transactions...');
      await seedPayments(false);
    }

    const giftCardCount = await GiftCard.countDocuments();
    if (env.enableDemoData && giftCardCount === 0) {
      console.log('[System] ENABLE_DEMO_DATA is true. Generating realistic gift cards...');
      await seedGiftCards(false);
    }

    const storeCreditCount = await StoreCreditAccount.countDocuments();
    if (env.enableDemoData && storeCreditCount === 0) {
      console.log('[System] ENABLE_DEMO_DATA is true. Generating store-credit accounts and transactions...');
      await seedStoreCredit(false);
    }

    const loyaltyAccountCount = await LoyaltyAccount.countDocuments();
    if (env.enableDemoData && loyaltyAccountCount === 0) {
      console.log('[System] ENABLE_DEMO_DATA is true. Generating loyalty accounts and transactions...');
      await seedLoyalty(false);
    }

    console.log('[System] Database auto-bootstrapping checks successfully completed!');
  } catch (error: any) {
    console.error('[System] Auto-seeding process encountered an issue:', error.message || error);
  }
};
