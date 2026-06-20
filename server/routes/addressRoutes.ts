import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';

const router = Router();

router.get('/', requireAuth, getAddresses);
router.post('/', requireAuth, createAddress);
router.put('/:id', requireAuth, updateAddress);
router.delete('/:id', requireAuth, deleteAddress);

export default router;
