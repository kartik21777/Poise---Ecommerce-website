import { connectDB } from './server/config/db.js';
import { runAutoSeeding } from './server/config/autoSeedRunner.js';
import { seedRefunds } from './server/scripts/generateRefunds.js';
import { seedReviews } from './server/scripts/generateReviews.js';

async function runFullSeed() {
  await connectDB();
  await runAutoSeeding();
  await seedRefunds();
  await seedReviews();
  process.exit(0);
}

runFullSeed();
