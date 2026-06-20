import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as wishlistController from '../controllers/wishlistController.js';
import { wishlistParamsSchema } from '../validations/wishlistValidation.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', wishlistController.getWishlist);
router.post('/:productId', validateRequest(wishlistParamsSchema), wishlistController.addItem);
router.delete('/:productId', validateRequest(wishlistParamsSchema), wishlistController.removeItem);

export default router;
