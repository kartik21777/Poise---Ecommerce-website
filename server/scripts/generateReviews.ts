import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { ProductReview } from '../models/ProductReview.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const RATING_DISTRIBUTION = [
  { rating: 5, probability: 0.60 },
  { rating: 4, probability: 0.25 },
  { rating: 3, probability: 0.10 },
  { rating: 2, probability: 0.03 },
  { rating: 1, probability: 0.02 }
];

const HELPFUL_VOTES_DISTRIBUTION = [
  { min: 0, max: 5, probability: 0.70 },
  { min: 6, max: 20, probability: 0.20 },
  { min: 21, max: 50, probability: 0.08 },
  { min: 51, max: 200, probability: 0.02 }
];

const REVIEW_CONTENT: Record<number, { titles: string[], bodies: string[] }> = {
  5: {
    titles: ["Excellent!", "Beyond expectations", "Absolutely love it", "Perfect purchase", "High quality"],
    bodies: [
      "This product is amazing. I didn't expect it to be this good for the price. Highly recommended!",
      "Exactly what I was looking for. The build quality is superb and it works perfectly.",
      "I've been using this for a week now and I'm very impressed. Five stars all the way.",
      "Great value for money. The design is sleek and the performance is top-notch.",
      "I'm so glad I bought this. It has made my life much easier. Will definitely buy again."
    ]
  },
  4: {
    titles: ["Very good", "Great product", "Solid purchase", "Minor issues but satisfied", "Good value"],
    bodies: [
      "Very good product overall. It does what it says on the box. Only minor complaint is the packaging.",
      "I like it a lot. It's well-made and durable. Shipping was a bit slow though.",
      "A solid purchase. Performance is great, although there's a slight learning curve.",
      "Good quality for the price. I'm satisfied with the results.",
      "Almost perfect. If it had one more feature, it would be five stars. Still, highly recommend."
    ]
  },
  3: {
    titles: ["Average", "Decent but not great", "It's okay", "Met basic needs", "Mixed feelings"],
    bodies: [
      "It's an average product. It works, but it's nothing special compared to other brands.",
      "Decent quality, but I expected more. It's okay for basic use.",
      "The product is fine, but the instructions were confusing.",
      "It does the job, but the materials feel a bit cheap.",
      "Not bad, but not great either. It's just okay."
    ]
  },
  2: {
    titles: ["Disappointing", "Not worth it", "Poor quality", "Could be better", "Wouldn't buy again"],
    bodies: [
      "I was disappointed with this purchase. It didn't work as expected and felt flimsy.",
      "Not worth the money. There are better alternatives out there for the same price.",
      "The product arrived with small scratches. The performance is also mediocre.",
      "I had high hopes, but this fell short. The build quality is lacking.",
      "It's okay for a while, but it started having issues after only a few uses."
    ]
  },
  1: {
    titles: ["Terrible", "Do not buy", "Waste of money", "Very poor", "Awful"],
    bodies: [
      "This is a terrible product. It broke within two days of use. Avoid at all costs!",
      "Complete waste of money. Doesn't work at all and customer service was unhelpful.",
      "The worst experience I've had with a purchase. The quality is non-existent.",
      "I wouldn't even give it one star if I could. Utterly disappointing.",
      "Low quality, arrived late, and didn't match the description. Stay away."
    ]
  }
};

const getRandomRating = (): number => {
  const rand = Math.random();
  let cumulative = 0;
  for (const dist of RATING_DISTRIBUTION) {
    cumulative += dist.probability;
    if (rand < cumulative) return dist.rating;
  }
  return 5;
};

const getRandomHelpfulVotes = (): number => {
  const rand = Math.random();
  let cumulative = 0;
  for (const dist of HELPFUL_VOTES_DISTRIBUTION) {
    cumulative += dist.probability;
    if (rand < cumulative) {
      return Math.floor(Math.random() * (dist.max - dist.min + 1)) + dist.min;
    }
  }
  return 0;
};

export async function seedReviews(shouldExit = false) {
  try {
    console.log('[Review Seed] Starting generation of 1500 reviews...');

    const users = await User.find();
    const products = await Product.find({ status: 'active' });
    const orders = await Order.find().populate('items.productId');

    if (users.length === 0 || products.length === 0) {
      console.log('[Review Seed] Missing users or products. Please seed them first.');
      if (shouldExit) process.exit(0);
      return;
    }

    // Map of users and the products they've purchased
    const purchaseMap: Map<string, Set<string>> = new Map();
    const orderLinkMap: Map<string, string> = new Map(); // key: "userId-productId", value: orderId

    orders.forEach(order => {
      const userId = order.user.toString();
      if (!purchaseMap.has(userId)) purchaseMap.set(userId, new Set());
      order.items.forEach(item => {
        const productId = (item.productId as any)._id?.toString() || item.productId.toString();
        purchaseMap.get(userId)!.add(productId);
        orderLinkMap.set(`${userId}-${productId}`, order._id.toString());
      });
    });

    const reviews = [];
    const usedPairs = new Set<string>();
    let attempts = 0;
    const maxAttempts = 10000;

    // First, try to generate reviews based on actual purchases (for better realism)
    const purchasers = Array.from(purchaseMap.keys());
    for (const userId of purchasers) {
      const productIds = Array.from(purchaseMap.get(userId)!);
      for (const productId of productIds) {
        if (reviews.length >= 1500) break;
        
        const pairKey = `${userId}-${productId}`;
        if (usedPairs.has(pairKey)) continue;

        const rating = getRandomRating();
        const content = REVIEW_CONTENT[rating];
        const title = content.titles[Math.floor(Math.random() * content.titles.length)];
        const body = content.bodies[Math.floor(Math.random() * content.bodies.length)];
        const orderId = orderLinkMap.get(pairKey);

        // Review date: 3-60 days after order (simplified)
        const createdAt = new Date(Date.now() - (Math.random() * 365) * 24 * 60 * 60 * 1000);

        reviews.push({
          user: new mongoose.Types.ObjectId(String(userId)),
          product: new mongoose.Types.ObjectId(String(productId)),
          order: orderId ? new mongoose.Types.ObjectId(String(orderId)) : undefined,
          rating,
          title,
          reviewBody: body,
          isVerifiedPurchase: true,
          status: 'approved',
          helpfulVotes: getRandomHelpfulVotes(),
          createdAt,
          updatedAt: createdAt
        });
        usedPairs.add(pairKey);
      }
      if (reviews.length >= 1500) break;
    }

    // Fill remaining reviews with random user-product pairs
    while (reviews.length < 1500 && attempts < maxAttempts) {
      attempts++;
      const user = users[Math.floor(Math.random() * users.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const userId = user._id.toString();
      const productId = product._id.toString();
      const pairKey = `${userId}-${productId}`;

      if (usedPairs.has(pairKey)) continue;

      const rating = getRandomRating();
      const content = REVIEW_CONTENT[rating];
      const title = content.titles[Math.floor(Math.random() * content.titles.length)];
      const body = content.bodies[Math.floor(Math.random() * content.bodies.length)];

      const createdAt = new Date(Date.now() - (Math.random() * 365) * 24 * 60 * 60 * 1000);

      reviews.push({
        user: user._id,
        product: product._id,
        rating,
        title,
        reviewBody: body,
        isVerifiedPurchase: false, // Strict: if no order found, it's not verified
        status: 'approved',
        helpfulVotes: getRandomHelpfulVotes(),
        createdAt,
        updatedAt: createdAt
      });
      usedPairs.add(pairKey);
    }

    console.log(`[Review Seed] Successfully generated ${reviews.length} reviews.`);

    // Validation: Check Average Rating
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    console.log(`[Review Seed] Validation: Average Rating = ${avgRating.toFixed(4)} (Expected: ~4.39)`);

    // Output JSON for transparency
    const outputPath = path.join(process.cwd(), 'reviews_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify(reviews, null, 2));

    // Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_reviews.js');
    const mongoScript = `
const reviews = ${JSON.stringify(reviews, null, 2)};
db.productreviews.insertMany(reviews.map(r => ({
  ...r,
  user: ObjectId(r.user),
  product: ObjectId(r.product),
  order: r.order ? ObjectId(r.order) : undefined,
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt)
})));
console.log('Seeded ' + reviews.length + ' reviews successfully');

// Run Verification Aggregation
const results = db.productreviews.aggregate([
  {
    $group: {
      _id: "$product",
      avgRating: { $avg: "$rating" },
      reviewCount: { $sum: 1 }
    }
  }
]).toArray();
console.log('Product Level Rating Summary (Sample of 5):', results.slice(0, 5));
`;
    fs.writeFileSync(scriptPath, mongoScript);

    // Seed into DB
    const result = await ProductReview.insertMany(reviews);
    console.log(`[Review Seed] Successfully seeded ${result.length} reviews.`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('[Review Seed] Error:', err);
    if (shouldExit) process.exit(1);
  }
}

// Only run immediately if this script is executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('generateReviews.ts') || 
  process.argv[1].endsWith('generateReviews.js')
);

if (isDirectRun) {
  connectDB().then(() => seedReviews(true));
}
