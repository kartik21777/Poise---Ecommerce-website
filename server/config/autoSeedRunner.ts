import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { seedAdmin } from '../scripts/seedAdmin.js';
import { seedProducts } from '../scripts/seedProducts.js';
import { seedUsers } from '../scripts/seedUsers.js';

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

    // Seed 1 Admin + 50 Customer profiles if user base is empty or minimal (e.g., less than 5 users)
    if (userCount < 5) {
      console.log('[System] Minimal user base detected. Auto-seeding 1 Admin and 50 rich Customer profiles...');
      await seedUsers(false);
    }

    console.log('[System] Database auto-bootstrapping checks successfully completed!');
  } catch (error: any) {
    console.error('[System] Auto-seeding process encountered an issue:', error.message || error);
  }
};
