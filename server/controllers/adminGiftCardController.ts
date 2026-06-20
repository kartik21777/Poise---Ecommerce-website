import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GiftCard } from '../models/GiftCard.js';
import { GiftCardTransaction } from '../models/GiftCardTransaction.js';
import { StoreCreditAccount } from '../models/StoreCreditAccount.js';
import { StoreCreditTransaction } from '../models/StoreCreditTransaction.js';
import { giftCardCreditService } from '../services/GiftCardCreditService.js';
import { User } from '../models/User.js'; // Let's check user model if reference is needed
import { AppError } from '../utils/AppError.js';

/**
 * Lists all Gift Cards
 */
export async function getGiftCards(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, currency } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }
    if (currency) {
      query.currency = String(currency).toUpperCase();
    }
    if (search) {
      // Find by partial code match or case-insensitive code match
      query.code = { $regex: String(search), $options: 'i' };
    }

    const cards = await GiftCard.find(query)
      .sort({ createdAt: -1 })
      .populate('issuedTo', 'firstName lastName email');

    res.json({
      success: true,
      count: cards.length,
      data: cards,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a single Gift Card
 */
export async function createGiftCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { originalValue, currency, expirationDate, issuedTo, note } = req.body;
    const operatorId = (req as any).user?._id?.toString() || 'SYSTEM';

    const card = await giftCardCreditService.createGiftCard({
      originalValue: Number(originalValue),
      currency: String(currency || 'USD'),
      expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      issuedTo,
      note,
      performedBy: operatorId,
    });

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk creates Gift Cards with unique cryptographically secure codes
 */
export async function bulkCreateGiftCards(req: Request, res: Response, next: NextFunction) {
  try {
    const { count, originalValue, currency, expirationDate, note } = req.body;
    const operatorId = (req as any).user?._id?.toString() || 'SYSTEM';

    const bulkCount = Number(count || 1);
    const valueNum = Number(originalValue);

    if (bulkCount <= 0 || bulkCount > 250) {
      throw new AppError(400, 'Bulk creation range must be between 1 and 250 cards per invocation.');
    }

    const createdCards = [];
    for (let i = 0; i < bulkCount; i++) {
      const card = await giftCardCreditService.createGiftCard({
        originalValue: valueNum,
        currency: String(currency || 'USD'),
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        note: note || `Bulk Issuance Wave #${i + 1}`,
        performedBy: operatorId,
      });
      createdCards.push(card);
    }

    res.status(201).json({
      success: true,
      count: createdCards.length,
      data: createdCards,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disables an active Gift Card
 */
export async function disableGiftCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const operatorId = (req as any).user?._id?.toString() || 'SYSTEM';

    const card = await giftCardCreditService.disableGiftCard(id, reason, operatorId);

    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists the Global Gift Card transaction ledger records
 */
export async function getGiftCardTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, giftCardId } = req.query;
    const query: any = {};

    if (type) {
      query.type = type;
    }
    if (giftCardId) {
      query.giftCard = new mongoose.Types.ObjectId(String(giftCardId));
    }

    const txs = await GiftCardTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'giftCard',
        select: 'code status balance'
      })
      .populate('orderId', 'orderNumber total');

    res.json({
      success: true,
      count: txs.length,
      data: txs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Credits a Customer's Store Credit account
 */
export async function creditStoreCredit(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, amount, currency, notes, expirationDays } = req.body;
    const operatorId = (req as any).user?._id?.toString() || 'SYSTEM';

    let expirationDate: Date | undefined;
    if (expirationDays && Number(expirationDays) > 0) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + Number(expirationDays));
    }

    const account = await giftCardCreditService.creditStoreCredit({
      userId,
      amount: Number(amount),
      currency: String(currency || 'USD'),
      notes,
      expirationDate,
      performedBy: operatorId,
    });

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Lists Store Credit accounts with users populated
 */
export async function getStoreCreditAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const { currency, search } = req.query;
    const query: any = {};

    if (currency) {
      query.currency = String(currency).toUpperCase();
    }

    let userIds: mongoose.Types.ObjectId[] = [];
    if (search) {
      // Find matching users
      const users = await User.find({
        $or: [
          { email: { $regex: String(search), $options: 'i' } },
          { firstName: { $regex: String(search), $options: 'i' } },
          { lastName: { $regex: String(search), $options: 'i' } },
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    const accounts = await StoreCreditAccount.find(query)
      .sort({ balance: -1 })
      .populate('user', 'firstName lastName email');

    res.json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Global Store Credit ledger audit log overview
 */
export async function getStoreCreditTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, accountId } = req.query;
    const query: any = {};

    if (type) {
      query.type = type;
    }
    if (accountId) {
      query.account = new mongoose.Types.ObjectId(String(accountId));
    }

    const txs = await StoreCreditTransaction.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'account',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('orderId', 'orderNumber total');

    res.json({
      success: true,
      count: txs.length,
      data: txs,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Liability & Financial reporting foundation
 */
export async function getLiabilityReport(req: Request, res: Response, next: NextFunction) {
  try {
    // Current outstanding system-wide liabilities per Currency:
    // Outstanding Gift Card liability = summation of available balances of all active gift cards
    // Outstanding Store Credit liability = summation of all active store credit accounts
    const gcSummaries = await GiftCard.aggregate([
      {
        $group: {
          _id: '$currency',
          totalActiveLiability: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ACTIVE'] }, '$balance', 0],
            },
          },
          originalIssuedValue: { $sum: '$originalValue' },
          totalRedeemedValue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'REDEEMED'] }, '$originalValue', 0],
            },
          },
          totalDisabledValue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'DISABLED'] }, '$balance', 0],
            },
          },
          totalExpiredValue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'EXPIRED'] }, '$balance', 0],
            },
          },
        },
      },
    ]);

    const scSummaries = await StoreCreditAccount.aggregate([
      {
        $group: {
          _id: '$currency',
          totalOutstandingCreditLiability: { $sum: '$balance' },
          activeAccounts: { $sum: { $cond: ['$isEnabled', 1, 0] } },
        },
      },
    ]);

    const currenciesSet = new Set<string>();
    gcSummaries.forEach(g => currenciesSet.add(g._id));
    scSummaries.forEach(s => currenciesSet.add(s._id));

    const reportingByCurrency: Record<string, any> = {};
    currenciesSet.forEach(c => {
      const gMatch = gcSummaries.find(g => g._id === c) || {
        totalActiveLiability: 0,
        originalIssuedValue: 0,
        totalRedeemedValue: 0,
        totalDisabledValue: 0,
        totalExpiredValue: 0,
      };
      const sMatch = scSummaries.find(s => s._id === c) || {
        totalOutstandingCreditLiability: 0,
        activeAccounts: 0,
      };

      reportingByCurrency[c] = {
        currency: c,
        giftCard: {
          outstandingActiveLiability: gMatch.totalActiveLiability,
          originalIssuedValue: gMatch.originalIssuedValue,
          totalRedeemedValue: gMatch.totalRedeemedValue,
          totalDisabledValue: gMatch.totalDisabledValue,
          totalExpiredValue: gMatch.totalExpiredValue,
        },
        storeCredit: {
          outstandingLiability: sMatch.totalOutstandingCreditLiability,
          activeAccountsCount: sMatch.activeAccounts,
        },
        totalLiabilityCombined: gMatch.totalActiveLiability + sMatch.totalOutstandingCreditLiability,
      };
    });

    res.json({
      success: true,
      data: reportingByCurrency,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * CSV Export formatted data payload for accounting spreadsheet dumps
 */
export async function csvExportGiftCards(req: Request, res: Response, next: NextFunction) {
  try {
    const cards = await GiftCard.find()
      .populate('issuedTo', 'email')
      .sort({ createdAt: -1 });

    let csvContent = 'ID,CODE,ORIGINAL_VALUE,BALANCE,CURRENCY,EXPIRATION_DATE,STATUS,ISSUED_TO_EMAIL,CREATED_AT\n';
    cards.forEach(c => {
      const email = (c.issuedTo as any)?.email || '';
      csvContent += `${c._id},${c.code},${c.originalValue},${c.balance},${c.currency},${c.expirationDate ? c.expirationDate.toISOString() : ''},${c.status},${email},${c.createdAt.toISOString()}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=gift_cards_export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}
