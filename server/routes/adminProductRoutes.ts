import express from 'express';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getAdminProducts,
  getAdminProductById,
  uploadProductImage,
  deleteProductImage,
  getDashboardStats
} from '../controllers/adminProductController.js';

import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import { createProductSchema, updateProductSchema, productSearchSchema } from '../validations/productValidation.js';

import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.use(requireAuth);
router.use(authorize('admin'));

router.post('/upload-image', upload.single('image'), uploadProductImage);
router.post('/delete-image', deleteProductImage);

router.get('/', validateRequest(productSearchSchema), getAdminProducts);
router.get('/stats', getDashboardStats);
router.get('/:id', getAdminProductById);
router.post('/', validateRequest(createProductSchema), createProduct);
router.put('/:id', validateRequest(updateProductSchema), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
