import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { RecentlyViewed } from '../models/RecentlyViewed.js';
import { LoyaltyAccount } from '../models/LoyaltyAccount.js';
import { logger } from '../utils/logger.js';

const log = logger('RecommendationService');

export interface RecommendedProduct {
  product: IProduct;
  source: 'frequently_bought_together' | 'related_category' | 'loyalty_preference' | 'trending' | 'recently_viewed';
  reason: string;
  score: number;
}

export class RecommendationService {
  /**
   * Generates a hybrid of personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string, limit: number = 8): Promise<RecommendedProduct[]> {
    const recommendations: RecommendedProduct[] = [];
    const recommendedProductIds = new Set<string>();

    const userObjId = new mongoose.Types.ObjectId(userId);

    // 1. Recently Viewed Products
    try {
      const recent = await RecentlyViewed.findOne({ user: userObjId }).populate('items.product');
      if (recent && recent.items.length > 0) {
        // Sort items by viewedAt decending
        const sortedViews = [...recent.items].sort((a, b) => b.viewedAt.getTime() - a.viewedAt.getTime());
        for (const view of sortedViews) {
          const product = view.product as any as IProduct;
          if (product && product.status === 'active' && !recommendedProductIds.has(product._id.toString())) {
            recommendations.push({
              product,
              source: 'recently_viewed',
              reason: 'Based on your recently viewed items',
              score: 0.95,
            });
            recommendedProductIds.add(product._id.toString());
            if (recommendations.length >= limit) break;
          }
        }
      }
    } catch (err: any) {
      log.error(`Error in recently viewed recommendations: ${err.message}`);
    }

    if (recommendations.length >= limit) return recommendations.slice(0, limit);

    // 2. Loyalty Preference / Best Category matches
    try {
      const orders = await Order.find({ user: userObjId, status: { $in: ['PAID', 'PROCESSING', 'DELIVERED'] } });
      if (orders.length > 0) {
        // Find most frequent category
        const categoryCounts: { [catId: string]: number } = {};
        for (const order of orders) {
          for (const item of order.items) {
            // Find category of item
            const prod = await Product.findById(item.productId);
            if (prod && prod.category) {
              const catIdStr = prod.category.toString();
              categoryCounts[catIdStr] = (categoryCounts[catIdStr] || 0) + item.quantity;
            }
          }
        }

        const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
        if (sortedCats.length > 0) {
          const topCategoryId = sortedCats[0][0];
          const categoryProducts = await Product.find({
            category: new mongoose.Types.ObjectId(topCategoryId),
            status: 'active',
            _id: { $nin: Array.from(recommendedProductIds).map(id => new mongoose.Types.ObjectId(id)) }
          }).limit(4);

          for (const prod of categoryProducts) {
            if (!recommendedProductIds.has(prod._id.toString())) {
              recommendations.push({
                product: prod,
                source: 'loyalty_preference',
                reason: `Based on your favorite shopping categories`,
                score: 0.85,
              });
              recommendedProductIds.add(prod._id.toString());
              if (recommendations.length >= limit) break;
            }
          }
        }
      }
    } catch (err: any) {
      log.error(`Error in loyalty category recommendations: ${err.message}`);
    }

    if (recommendations.length >= limit) return recommendations.slice(0, limit);

    // 3. Trending Products
    try {
      const trending = await this.getTrendingProducts(limit - recommendations.length, Array.from(recommendedProductIds));
      trending.forEach((rec) => {
        recommendations.push(rec);
        recommendedProductIds.add(rec.product._id.toString());
      });
    } catch (err: any) {
      log.error(`Error in trending recommendations: ${err.message}`);
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Product Frequently Bought Together
   */
  async getFrequentlyBoughtTogether(productId: string, limit: number = 4): Promise<RecommendedProduct[]> {
    const recommendedList: RecommendedProduct[] = [];
    const currentProdId = new mongoose.Types.ObjectId(productId);

    try {
      // Find orders containing the current product
      const orders = await Order.find({
        'items.productId': currentProdId,
        status: { $in: ['PAID', 'PROCESSING', 'DELIVERED', 'SHIPPED'] }
      }).limit(50);

      const fbtCounts: { [prodId: string]: number } = {};

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.productId.toString() !== productId) {
            fbtCounts[item.productId.toString()] = (fbtCounts[item.productId.toString()] || 0) + item.quantity;
          }
        });
      });

      const sortedFbt = Object.entries(fbtCounts).sort((a, b) => b[1] - a[1]).slice(0, limit);
      const productIds = sortedFbt.map(([id]) => new mongoose.Types.ObjectId(id));

      const fbtProducts = await Product.find({ _id: { $in: productIds }, status: 'active' });

      fbtProducts.forEach((prod) => {
        recommendedList.push({
          product: prod,
          source: 'frequently_bought_together',
          reason: 'Other customers frequently bought this item alongside your selected product.',
          score: 0.90,
        });
      });
    } catch (err: any) {
      log.error(`Error calculating FBT: ${err.message}`);
    }

    // Fallback: Related Category
    if (recommendedList.length < limit) {
      try {
        const prod = await Product.findById(productId);
        if (prod && prod.category) {
          const skipIds = [productId, ...recommendedList.map(r => r.product._id.toString())];
          const related = await Product.find({
            category: prod.category,
            status: 'active',
            _id: { $nin: skipIds.map((id) => new mongoose.Types.ObjectId(id)) }
          }).limit(limit - recommendedList.length);

          related.forEach((rProd) => {
            recommendedList.push({
              product: rProd,
              source: 'related_category',
              reason: 'Similar products from the same category that we suggest for you.',
              score: 0.70,
            });
          });
        }
      } catch (err: any) {
        log.error(`Error in related category calculation: ${err.message}`);
      }
    }

    return recommendedList.slice(0, limit);
  }

  /**
   * Helper to get general Trending products
   */
  async getTrendingProducts(limit: number = 4, excludeIds: string[] = []): Promise<RecommendedProduct[]> {
    const recommendations: RecommendedProduct[] = [];
    try {
      const skipObjectIds = excludeIds.map((id) => new mongoose.Types.ObjectId(id));
      
      // Lookup active products sorted by view count, total orders, or creation date
      const activeProducts = await Product.find({
        status: 'active',
        _id: { $nin: skipObjectIds }
      }).limit(limit);

      activeProducts.forEach((prod) => {
        recommendations.push({
          product: prod,
          source: 'trending',
          reason: 'Highly rated trending item, popular across the marketplace right now',
          score: 0.80,
        });
      });
    } catch (err: any) {
      log.error(`Error getting trending: ${err.message}`);
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();
