import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url('Invalid image URL').optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
