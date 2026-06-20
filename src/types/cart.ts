import { Product } from './product.js';

export interface CartItem {
  id: string;
  product: Product;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncCartItem {
  productId: string;
  variantSku: string;
  quantity: number;
}
