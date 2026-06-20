import { Product } from './product.js';

export interface Wishlist {
  id: string;
  user: string;
  products: Product[];
  createdAt: string;
  updatedAt: string;
}
