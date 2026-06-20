import express from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  getAdminCurrencies,
  createAdminCurrency,
  updateAdminCurrency,
  getAdminExchangeRates,
  updateAdminExchangeRates,
  getAdminRegionalPrices,
  createAdminRegionalPrice,
  deleteAdminRegionalPrice,
} from '../controllers/adminCurrencyController.js';

const router = express.Router();

router.use(requireAuth);
router.use(authorize('admin'));

// Currency routes
router.get('/currencies', getAdminCurrencies);
router.post('/currencies', createAdminCurrency);
router.put('/currencies/:id', updateAdminCurrency);

// Exchange rate version management routes
router.get('/exchange-rates', getAdminExchangeRates);
router.post('/exchange-rates', updateAdminExchangeRates);

// Regional pricing routes
router.get('/regional-prices', getAdminRegionalPrices);
router.post('/regional-prices', createAdminRegionalPrice);
router.delete('/regional-prices/:id', deleteAdminRegionalPrice);

export default router;
