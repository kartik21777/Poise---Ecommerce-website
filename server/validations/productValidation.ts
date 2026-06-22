import { z } from 'zod';
import { paginationSchema } from './commonValidation.js';

const imageSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  altText: z.string().optional(),
});

const variantSchema = z.object({
  sku: z.string().min(1),
  size: z.string().optional(),
  color: z.string().optional(),
  colorHex: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  priceOverride: z.number().min(0).optional(),
  images: z.array(imageSchema).optional().default([]),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    shortDescription: z.string().optional(),
    category: z.string().min(1, 'Category ID is required'),
    brand: z.string().optional(),
    images: z.array(imageSchema).optional().default([]),
    variants: z.array(variantSchema).optional().default([]),
    price: z.number().min(0),
    compareAtPrice: z.number().min(0).optional(),
    tags: z.array(z.string()).optional().default([]),
    status: z.enum(['draft', 'active', 'archived']).optional().default('draft'),
    isFeatured: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().optional(),
    description: z.string().min(1).optional(),
    shortDescription: z.string().optional(),
    category: z.string().min(1).optional(),
    brand: z.string().optional(),
    images: z.array(imageSchema).optional(),
    variants: z.array(variantSchema).optional(),
    price: z.number().min(0).optional(),
    compareAtPrice: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    isFeatured: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
  }),
});

export const productSearchSchema = z.object({
  query: paginationSchema.shape.query.extend({
    q: z.string().max(100).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    tag: z.string().optional(),
    minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
    maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
    createdAfter: z.string().datetime({ offset: true }).optional(),
    createdBefore: z.string().datetime({ offset: true }).optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductSearchQuery = z.infer<typeof productSearchSchema>['query'];
