import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as rvController from '../controllers/recentlyViewedController.js';
import { z } from 'zod';

const router = express.Router();

const paramsSchema = z.object({
  params: z.object({
    productId: z.string().min(1),
  })
});

router.use(requireAuth);

router.get('/', rvController.getRecentlyViewed);
router.post('/:productId', validateRequest(paramsSchema), rvController.addRecentlyViewed);

export default router;
