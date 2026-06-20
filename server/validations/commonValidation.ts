import { z } from 'zod';

export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform((val) => {
      const num = Number(val);
      return num > 100 ? 100 : num; // Enforce max page size
    }).optional().default(10),
    sort: z.enum(['newest', 'oldest', 'price-asc', 'price-desc', 'featured']).optional().default('newest'),
  }).passthrough(), // Allow other query params for filtering
});

export type PaginationQuery = z.infer<typeof paginationSchema>['query'];
