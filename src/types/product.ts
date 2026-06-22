import { Category } from './category.js';

export interface ProductImage {
  url: string;
  altText?: string;
}

export interface ProductVariant {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  priceOverride?: number;
  images: ProductImage[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string | Category;
  brand?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  price: number;
  compareAtPrice?: number;
  tags: string[];
  status: string;
  isFeatured: boolean;
  salesCount: number;
  metaTitle?: string;
  metaDescription?: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchQuery {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  category?: string;
  brand?: string;
  tag?: string;
  minPrice?: number;
  maxPrice?: number;
  createdAfter?: string;
  createdBefore?: string;
}
