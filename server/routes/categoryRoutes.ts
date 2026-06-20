import express from 'express';
import { 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  getActiveCategories, 
  getAllCategories, 
  getCategoryBySlug 
} from '../controllers/categoryController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import { createCategorySchema, updateCategorySchema } from '../validations/categoryValidation.js';

const router = express.Router();

// Public routes
router.get('/', getActiveCategories);
router.get('/:slug', getCategoryBySlug);

// Admin routes
router.use(requireAuth);
router.use(authorize('admin'));

router.get('/admin/all', getAllCategories);
router.post('/', validateRequest(createCategorySchema), createCategory);
router.put('/:id', validateRequest(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
