import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GiftCard } from '../models/GiftCard.js';
import { GiftCardTransaction } from '../models/GiftCardTransaction.js';
import { StoreCreditAccount } from '../models/StoreCreditAccount.js';
import { StoreCreditTransaction } from '../models/StoreCreditTransaction.js';
import { giftCardCreditService } from '../services/GiftCardCreditService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Returns complete customer Wallet dashboard data.
 * Includes store credit accounts, gift cards issued to the customer, and combined history.
 */
export async function getWalletDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    if (!userId) {
      throw new AppError(401, 'Authentication is required.');
    }

    const userIdObj = new mongoose.Types.ObjectId(userId);

    // 1. Fetch all store credit accounts for user
    const storeCreditAccounts = await StoreCreditAccount.find({ user: userIdObj });

    // 2. Fetch all gift cards explicitly issued to this user
    const giftCards = await GiftCard.find({ issuedTo: userIdObj }).sort({ createdAt: -1 });

    // 3. Fetch collective Store credit ledger rows
    const storeCreditAccountIds = storeCreditAccounts.map(a => a._id);
    const creditTxs = await StoreCreditTransaction.find({ account: { $in: storeCreditAccountIds } })
      .sort({ transactionDate: -1 })
      .populate('orderId', 'orderNumber total');

    // 4. Fetch collective Gift Card ledger rows
    const giftCardIds = giftCards.map(c => c._id);
    const giftCardTxs = await GiftCardTransaction.find({ giftCard: { $in: giftCardIds } })
      .sort({ transactionDate: -1 })
      .populate('orderId', 'orderNumber total');

    res.json({
      success: true,
      data: {
        storeCredit: storeCreditAccounts,
        giftCards: giftCards,
        history: {
          storeCreditTransactions: creditTxs,
          giftCardTransactions: giftCardTxs,
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Customer redeems a Gift Card Code fully to their Store Credit Account balance
 */
export async function redeemGiftCard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    const { code } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication is required.');
    }
    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'A valid gift card code is required.');
    }

    const result = await giftCardCreditService.redeemGiftCardToStoreCredit(code, userId.toString());

    res.json({
      success: true,
      message: `Successfully redeemed gift card! Loaded ${result.giftCard.currency} ${result.loadedAmount} of credit to your wallet.`,
      data: {
        giftCard: result.giftCard,
        storeCreditAccount: result.storeCreditAccount,
        redeemedAmount: result.loadedAmount,
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dynamic Checkout Allocation Preview
 */
export async function getCheckoutAllocationPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?._id;
    const { totalAmount, currency, giftCardCodes, useStoreCredit } = req.body;

    if (!userId) {
      throw new AppError(401, 'Authentication is required.');
    }
    if (!totalAmount || isNaN(totalAmount)) {
      throw new AppError(400, 'Total amount is required and must be a number.');
    }
    if (!currency) {
      throw new AppError(400, 'Currency parameter is required.');
    }

    const allocations = await giftCardCreditService.determineAllocations({
      userId: userId.toString(),
      totalAmount: Number(totalAmount),
      currency: String(currency),
      giftCardCodes: giftCardCodes || [],
      useStoreCredit: !!useStoreCredit,
    });

    res.json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
}
