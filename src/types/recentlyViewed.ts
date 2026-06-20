import { Product } from './product.js';

export interface RecentlyViewedItem {
  product: Product;
  viewedAt: string;
}

export interface RecentlyViewed {
  id: string;
  user: string;
  items: RecentlyViewedItem[];
  createdAt: string;
  updatedAt: string;
}
