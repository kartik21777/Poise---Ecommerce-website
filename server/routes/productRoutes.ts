import express from 'express';
import { 
  getProducts, 
  getProductBySlug, 
  getFeaturedProducts, 
  getNewArrivals, 
  getBestSellers, 
  getRelatedProducts 
} from '../controllers/productController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { productSearchSchema } from '../validations/productValidation.js';

const router = express.Router();

// Discovery APIs
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);

// Search & Filtering
router.get('/', validateRequest(productSearchSchema), getProducts);

// Individual Product
router.get('/:slug', getProductBySlug);
router.get('/:slug/related', getRelatedProducts);

export default router;
