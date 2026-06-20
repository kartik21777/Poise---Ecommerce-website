import express from 'express';
import { requireAuth, authorize } from '../middleware/authMiddleware.js';
import {
  getGiftCards,
  createGiftCard,
  bulkCreateGiftCards,
  disableGiftCard,
  getGiftCardTransactions,
  creditStoreCredit,
  getStoreCreditAccounts,
  getStoreCreditTransactions,
  getLiabilityReport,
  csvExportGiftCards
} from '../controllers/adminGiftCardController.js';

const router = express.Router();

router.use(requireAuth);
router.use(authorize('admin'));

// Liability & Financial reporting foundation
router.get('/liability-report', getLiabilityReport);

// Gift cards administration CRUD & Actions
router.get('/cards', getGiftCards);
router.post('/cards', createGiftCard);
router.post('/cards/bulk-create', bulkCreateGiftCards);
router.post('/cards/:id/disable', disableGiftCard);
router.get('/cards/transactions', getGiftCardTransactions);
router.get('/cards/csv-export', csvExportGiftCards);

// Customer Store Credit balances & ledger audit lines
router.get('/store-credit', getStoreCreditAccounts);
router.post('/store-credit/credit', creditStoreCredit);
router.get('/store-credit/transactions', getStoreCreditTransactions);

export default router;
