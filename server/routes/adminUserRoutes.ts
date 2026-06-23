import express from 'express';
import { getUsers, updateUserRole } from '../controllers/adminUserController.js';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication + admin role
router.use(requireAuth);
router.use(authorize('admin'));

router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);

export default router;
