import { RecentlyViewed } from '../models/RecentlyViewed.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

const RECENTLY_VIEWED_LIMIT = 20;

export const getRecentlyViewed = async (userId: string) => {
  let rv = await RecentlyViewed.findOne({ user: userId }).populate('items.product');
  if (!rv) {
    rv = await RecentlyViewed.create({ user: userId, items: [] });
  }
  return rv;
};

export const addRecentlyViewed = async (userId: string, productId: string) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  let rv = await RecentlyViewed.findOne({ user: userId });
  if (!rv) {
    rv = await RecentlyViewed.create({ user: userId, items: [] });
  }

  // Remove if exists to bring to top
  rv.items = rv.items.filter(item => item.product.toString() !== productId) as any;
  
  // Add to front
  rv.items.unshift({ product: productId as any, viewedAt: new Date() });

  // Enforce limit
  if (rv.items.length > RECENTLY_VIEWED_LIMIT) {
    rv.items = rv.items.slice(0, RECENTLY_VIEWED_LIMIT) as any;
  }

  await rv.save();
  return await rv.populate('items.product');
};
