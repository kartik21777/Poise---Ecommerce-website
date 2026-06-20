import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import * as cartController from '../controllers/cartController.js';
import { cartItemSchema, updateCartItemSchema, syncCartSchema } from '../validations/cartValidation.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', validateRequest(cartItemSchema), cartController.addItem);
router.post('/sync', validateRequest(syncCartSchema), cartController.syncCart);
router.put('/items/:id', validateRequest(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
