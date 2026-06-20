import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { seedAdmin } from '../scripts/seedAdmin.js';
import { seedProducts } from '../scripts/seedProducts.js';
import { seedUsers } from '../scripts/seedUsers.js';
import { seedOrders } from '../scripts/generateOrders.js';
import { env } from './env.js';
import { Order } from '../models/Order.js';

export const runAutoSeeding = async () => {
  try {
    console.log('[System] Verifying database seeding status...');

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

    console.log('[System] Database auto-bootstrapping checks successfully completed!');
  } catch (error: any) {
    console.error('[System] Auto-seeding process encountered an issue:', error.message || error);
  }
};
