import { z } from 'zod';

export const cartItemSchema = z.object({
  body: z.object({
    productId: z.string().min(1, 'Product ID is required'),
    variantSku: z.string().min(1, 'Variant SKU is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity must be less than 100'),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Item ID is required'), // This refers to CartItemId or VariantSku, depending on design. Let's use variantSku or internal cart item ID.
  }),
  body: z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99, 'Quantity must be less than 100'),
  }),
});

export const syncCartSchema = z.object({
  body: z.object({
    items: z.array(z.object({
      productId: z.string(),
      variantSku: z.string(),
      quantity: z.number().int().min(1).max(99),
    })),
  }),
});
