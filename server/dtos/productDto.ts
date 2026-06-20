import { IProduct, IProductVariant, IProductImage } from '../models/Product.js';
import { CategoryResponse, toCategoryDto } from './categoryDto.js';

export interface ProductImageResponse {
  url: string;
  altText?: string;
}

export interface ProductVariantResponse {
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  stock: number;
  priceOverride?: number;
  images: ProductImageResponse[];
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string | CategoryResponse;
  brand?: string;
  images: ProductImageResponse[];
  variants: ProductVariantResponse[];
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

const mapImages = (images: IProductImage[]): ProductImageResponse[] => {
  return images.map(img => ({
    url: img.secure_url,
    altText: img.altText,
  }));
};

const mapVariants = (variants: IProductVariant[]): ProductVariantResponse[] => {
  return variants.map(v => ({
    sku: v.sku,
    size: v.size,
    color: v.color,
    colorHex: v.colorHex,
    stock: v.stock,
    priceOverride: v.priceOverride,
    images: mapImages(v.images),
  }));
};

export const toProductDto = (product: IProduct): ProductResponse => {
  // Check if category is populated
  const isPopulatedCategory = product.category && typeof product.category === 'object' && 'name' in product.category;
  
  return {
    id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    category: isPopulatedCategory ? toCategoryDto(product.category as any) : product.category.toString(),
    brand: product.brand,
    images: mapImages(product.images),
    variants: mapVariants(product.variants),
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    tags: product.tags,
    status: product.status,
    isFeatured: product.isFeatured,
    salesCount: product.salesCount,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    lowStockThreshold: product.lowStockThreshold,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
};
