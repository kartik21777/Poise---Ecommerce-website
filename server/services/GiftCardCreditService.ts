import crypto from 'crypto';
import mongoose from 'mongoose';
import { GiftCard, IGiftCard, GiftCardStatus } from '../models/GiftCard.js';
import { GiftCardTransaction, IGiftCardTransaction } from '../models/GiftCardTransaction.js';
import { StoreCreditAccount, IStoreCreditAccount } from '../models/StoreCreditAccount.js';
import { StoreCreditTransaction, IStoreCreditTransaction } from '../models/StoreCreditTransaction.js';
import { exchangeRateService } from './ExchangeRateService.js';
import { lockService } from './LockService.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const log = logger('GiftCardCreditService');

export interface IGiftCardAllocationResult {
  giftCardId: string;
  code: string;
  allocatedAmountInOrderCurrency: number; 
  allocatedAmountInCardCurrency: number;
}

export interface IAllocationResult {
  giftCardAllocations: IGiftCardAllocationResult[];
  storeCreditAllocated: number; // in order currency
  storeCreditSourceCurrency?: string;
  gatewayAmountAllocated: number; // in order currency
  orderCurrency: string;
  exchangeRateVersionId?: string;
  loyaltyPointsAllocated?: number;
  loyaltyAmountAllocated?: number;
}

export class GiftCardCreditService {
  constructor() {}

  /**
   * Helper to convert currencies explicitly and auditably
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string, ratesVersion: any): number {
    const fromUpper = fromCurrency.toUpperCase();
    const toUpper = toCurrency.toUpperCase();
    if (fromUpper === toUpper) {
      return amount;
    }

    const rates = ratesVersion.rates || [];
    const fromRateObj = rates.find((r: any) => r.targetCurrency === fromUpper);
    const toRateObj = rates.find((r: any) => r.targetCurrency === toUpper);

    const fromRate = fromRateObj ? fromRateObj.rate : 1.0;
    const toRate = toRateObj ? toRateObj.rate : 1.0;

    // Convert to Base (USD) first, then to ToCurrency
    const inUsd = amount / fromRate;
    const result = inUsd * toRate;

    // Precision rounding (e.g. 4 decimals for internal calculation, formatted visually downstream)
    return Number(result.toFixed(4));
  }

  /**
   * Section 1.5 - Cryptographically secure unique non-sequential codes
   */
  generateUniqueCode(): string {
    const block1 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const block2 = crypto.randomBytes(3).toString('hex').toUpperCase();
    const block3 = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `GC-${block1}-${block2}-${block3}`;
  }

  /**
   * Section 1 - Create / Issue a Gift Card
   */
  async createGiftCard(params: {
    originalValue: number;
    currency: string;
    expirationDate?: Date;
    issuedTo?: string;
    note?: string;
    performedBy?: string;
  }): Promise<IGiftCard> {
    const { originalValue, currency, expirationDate, issuedTo, note, performedBy } = params;

    if (originalValue <= 0) {
      throw new AppError(400, 'Original value of a gift card must be positive.');
    }

    let uniqueCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      uniqueCode = this.generateUniqueCode();
      const existing = await GiftCard.findOne({ code: uniqueCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new AppError(500, 'Could not generate a unique cryptographically safe code.');
    }

    // Atomic session wrapper
    const giftCard = await GiftCard.create({
      code: uniqueCode,
      originalValue,
      balance: originalValue,
      currency: currency.toUpperCase(),
      expirationDate,
      status: 'ACTIVE',
      issuedTo: issuedTo ? new mongoose.Types.ObjectId(issuedTo) : undefined,
    });

    // Issuance Transaction Ledger Entry (Section 1.6)
    await GiftCardTransaction.create({
      giftCard: giftCard._id,
      type: 'ISSUANCE',
      amount: originalValue,
      currency: currency.toUpperCase(),
      note: note || 'Administrative Gift Card Issuance Campaign',
      performedBy: performedBy || 'SYSTEM',
    });

    await AuditLog.create({
      action: 'GIFT_CARD_ISSUANCE',
      entityType: 'GiftCard',
      entityId: giftCard._id.toString(),
      payload: { code: uniqueCode, originalValue, currency, expirationDate },
      reason: note || 'Gift Card Creation',
    });

    return giftCard;
  }

  /**
   * Deactivates / Disables a Gift Card
   */
  async disableGiftCard(id: string, reason?: string, performedBy?: string): Promise<IGiftCard> {
    const lockKey = `lock:giftcard:${id}`;
    return await lockService.withLock(lockKey, 10000, async () => {
      const card = await GiftCard.findById(id);
      if (!card) {
        throw new AppError(404, 'Gift Card not found.');
      }

      card.status = 'DISABLED';
      await card.save();

      await AuditLog.create({
        action: 'GIFT_CARD_DISABLED',
        entityType: 'GiftCard',
        entityId: id,
        payload: { code: card.code, reason },
        reason: reason || 'Administrative direct disable command.',
      });

      return card;
    });
  }

  /**
   * Section 2 - Fetch or instantiate customer StoreCreditAccount per currency
   */
  async getOrCreateStoreCreditAccount(userId: string, currency: string): Promise<IStoreCreditAccount> {
    const cleanCurrency = currency.toUpperCase();
    let account = await StoreCreditAccount.findOne({ user: new mongoose.Types.ObjectId(userId), currency: cleanCurrency });
    
    if (!account) {
      try {
        account = await StoreCreditAccount.create({
          user: new mongoose.Types.ObjectId(userId),
          currency: cleanCurrency,
          balance: 0,
          isEnabled: true,
        });
      } catch (err: any) {
        // Handle race conditions where dual queries create account
        if (err.code === 11000) {
          account = await StoreCreditAccount.findOne({ user: new mongoose.Types.ObjectId(userId), currency: cleanCurrency }) as any;
        } else {
          throw err;
        }
      }
    }
    return account;
  }

  /**
   * Section 2 & 2.5 - Load/Credit Store Credits
   */
  async creditStoreCredit(params: {
    userId: string;
    amount: number;
    currency: string;
    notes?: string;
    giftCardSource?: string;
    expirationDate?: Date;
    expirationReason?: string;
    performedBy?: string;
    refundId?: string;
  }): Promise<IStoreCreditAccount> {
    const { userId, amount, currency, notes, giftCardSource, expirationDate, expirationReason, performedBy, refundId } = params;

    if (amount <= 0) {
      throw new AppError(400, 'Credit load amount must be positive.');
    }

    const cleanCurrency = currency.toUpperCase();
    const lockKey = `lock:storecredit:${userId}:${cleanCurrency}`;

    return await lockService.withLock(lockKey, 15000, async () => {
      const account = await this.getOrCreateStoreCreditAccount(userId, cleanCurrency);

      if (!account.isEnabled) {
        throw new AppError(400, 'Customer store credit account is currently deactivated.');
      }

      // Record Ledger Transaction (Section 2.5)
      const ledgerTx = await StoreCreditTransaction.create({
        account: account._id,
        type: refundId ? 'REFUND_CREDIT' : 'CREDIT_LOAD',
        amount: amount,
        currency: cleanCurrency,
        giftCardSource: giftCardSource ? new mongoose.Types.ObjectId(giftCardSource) : undefined,
        refundId: refundId ? new mongoose.Types.ObjectId(refundId) : undefined,
        expirationDate,
        expirationReason,
        isExpiring: !!expirationDate,
        notes: notes || 'Store Credit load operation.',
        performedBy: performedBy || 'SYSTEM',
      });

      // Update structural balance atomically based strictly on ledger debit/credit logic (Section 2.5)
      account.balance = Number((account.balance + amount).toFixed(4));
      await account.save();

      await AuditLog.create({
        action: 'STORE_CREDIT_LOAD',
        entityType: 'StoreCreditAccount',
        entityId: account._id.toString(),
        payload: { amount, currency: cleanCurrency, transactionId: ledgerTx._id },
        reason: notes || 'Store Credit crediting event.',
      });

      return account;
    });
  }

  /**
   * Section 2.5 - Debit/Redeem Store Credits with double-spend prevention
   */
  async debitStoreCredit(params: {
    userId: string;
    amount: number;
    currency: string;
    orderId: string;
    notes?: string;
    performedBy?: string;
  }): Promise<IStoreCreditAccount> {
    const { userId, amount, currency, orderId, notes, performedBy } = params;

    if (amount <= 0) {
      throw new AppError(400, 'Debit amount must be positive.');
    }

    const cleanCurrency = currency.toUpperCase();
    const lockKey = `lock:storecredit:${userId}:${cleanCurrency}`;

    return await lockService.withLock(lockKey, 15000, async () => {
      const account = await this.getOrCreateStoreCreditAccount(userId, cleanCurrency);

      if (!account.isEnabled) {
        throw new AppError(400, 'Customer store credit account is currently disabled.');
      }

      if (account.balance < amount) {
        throw new AppError(400, `Insufficient store credit balance: Available ${account.balance} ${cleanCurrency}. Needed: ${amount}`);
      }

      // Ledger Transaction Record
      const ledgerTx = await StoreCreditTransaction.create({
        account: account._id,
        type: 'DEBIT_SPEND',
        amount: -amount, // Negative for spending
        currency: cleanCurrency,
        orderId: new mongoose.Types.ObjectId(orderId),
        notes: notes || 'Order reservation payment allocation.',
        performedBy: performedBy || 'SYSTEM',
      });

      // Update balance
      account.balance = Number((account.balance - amount).toFixed(4));
      await account.save();

      await AuditLog.create({
        action: 'STORE_CREDIT_SPEND',
        entityType: 'StoreCreditAccount',
        entityId: account._id.toString(),
        payload: { amount, currency: cleanCurrency, orderId, transactionId: ledgerTx._id },
        reason: notes || 'Checkout debit event.',
      });

      return account;
    });
  }

  /**
   * Section 2.5 & 4 - Redeem a Gift Card to Store Credit Account with multi-currency safety
   */
  async redeemGiftCardToStoreCredit(code: string, userId: string, performedBy?: string): Promise<{
    giftCard: IGiftCard;
    storeCreditAccount: IStoreCreditAccount;
    loadedAmount: number;
  }> {
    const normalizedCode = code.trim().toUpperCase();
    const ratesVersion = await exchangeRateService.getLatestRates();
    
    // Global lock on gift card to protect against double spends & racing
    const lockKey = `lock:giftcardcode:${normalizedCode}`;
    return await lockService.withLock(lockKey, 20000, async () => {
      const card = await GiftCard.findOne({ code: normalizedCode });
      if (!card) {
        throw new AppError(444, `Gift card code "${normalizedCode}" is not registered.`);
      }

      if (card.status !== 'ACTIVE') {
        throw new AppError(400, `Gift card code is not active (current status: ${card.status}).`);
      }

      if (card.balance <= 0) {
        card.status = 'REDEEMED';
        await card.save();
        throw new AppError(400, 'Gift card has a zero balance.');
      }

      if (card.expirationDate && card.expirationDate < new Date()) {
        card.status = 'EXPIRED';
        await card.save();
        throw new AppError(400, 'Gift card has expired.');
      }

      const activeWalletCurrency = card.currency; // Store credit destination matching card's native currency
      const cardBalance = card.balance;

      // Deduct gift card fully
      card.balance = 0;
      card.status = 'REDEEMED';
      await card.save();

      // Write Gift Card Redemption transaction
      const gcTx = await GiftCardTransaction.create({
        giftCard: card._id,
        type: 'REDEMPTION',
        amount: -cardBalance,
        currency: activeWalletCurrency,
        note: `Redeemed fully and moved into Store Credit balance.`,
        performedBy: performedBy || userId,
      });

      // Load fully into user's Store Credit Account of matched currency
      const storeCreditAccount = await this.creditStoreCredit({
        userId,
        amount: cardBalance,
        currency: activeWalletCurrency,
        giftCardSource: card._id.toString(),
        notes: `Balance loaded from Gift Card code: ${card.code}`,
        performedBy: performedBy || 'SYSTEM',
      });

      return {
        giftCard: card,
        storeCreditAccount,
        loadedAmount: cardBalance,
      };
    });
  }

  /**
   * Section 3.5 - Payment Allocation Engine
   * Allocates how much of order total (in billing settlement currency) is paid by gift cards, store credit, and gateway.
   */
  async determineAllocations(params: {
    userId: string;
    totalAmount: number;
    currency: string;
    giftCardCodes?: string[];
    useStoreCredit?: boolean;
    pointsToRedeem?: number;
  }): Promise<IAllocationResult> {
    const { userId, totalAmount, currency, giftCardCodes = [], useStoreCredit = false, pointsToRedeem = 0 } = params;
    const orderCurrency = currency.toUpperCase();
    const ratesVersion = await exchangeRateService.getLatestRates();

    let remainingToAllocate = totalAmount;
    const giftCardAllocations: IGiftCardAllocationResult[] = [];
    let storeCreditAllocated = 0;

    // 1. Process Gift Cards (First Priority)
    for (const rawCode of giftCardCodes) {
      if (remainingToAllocate <= 0) {
        break;
      }

      const normalizedCode = rawCode.trim().toUpperCase();
      const card = await GiftCard.findOne({ code: normalizedCode });

      if (card && card.status === 'ACTIVE' && card.balance > 0) {
        // Enforce expiration check
        if (card.expirationDate && card.expirationDate < new Date()) {
          card.status = 'EXPIRED';
          await card.save();
          continue;
        }

        // Convert card balance to order currency (explicit conversion - Section 4.5)
        const cardBalanceInOrderCurrency = this.convertCurrency(
          card.balance,
          card.currency,
          orderCurrency,
          ratesVersion
        );

        if (cardBalanceInOrderCurrency <= 0) {
          continue;
        }

        const allocatedInOrderCurrency = Math.min(cardBalanceInOrderCurrency, remainingToAllocate);
        
        // Convert allocation back to card's original base currency for precise card debit logic
        let allocatedInCardCurrency = this.convertCurrency(
          allocatedInOrderCurrency,
          orderCurrency,
          card.currency,
          ratesVersion
        );

        // Cap to actual balance if rounding drifted
        if (allocatedInCardCurrency > card.balance) {
          allocatedInCardCurrency = card.balance;
        }

        giftCardAllocations.push({
          giftCardId: card._id.toString(),
          code: card.code,
          allocatedAmountInOrderCurrency: Number(allocatedInOrderCurrency.toFixed(4)),
          allocatedAmountInCardCurrency: Number(allocatedInCardCurrency.toFixed(4)),
        });

        remainingToAllocate = Number((remainingToAllocate - allocatedInOrderCurrency).toFixed(4));
      }
    }

    // 2. Process Store Credit (Secondary Priority)
    if (useStoreCredit && remainingToAllocate > 0) {
      // Find all store credit balances for user
      const creditAccounts = await StoreCreditAccount.find({
        user: new mongoose.Types.ObjectId(userId),
        isEnabled: true,
        balance: { $gt: 0 },
      });

      // Priority: use the currency-matched account first
      const matchedAccount = creditAccounts.find(a => a.currency === orderCurrency);
      const otherAccounts = creditAccounts.filter(a => a.currency !== orderCurrency);

      const accountsInRoute = matchedAccount ? [matchedAccount, ...otherAccounts] : otherAccounts;

      for (const account of accountsInRoute) {
        if (remainingToAllocate <= 0) {
          break;
        }

        const accountBalanceInOrderCurrency = this.convertCurrency(
          account.balance,
          account.currency,
          orderCurrency,
          ratesVersion
        );

        if (accountBalanceInOrderCurrency <= 0) {
          continue;
        }

        const allocatedInOrderCurrency = Math.min(accountBalanceInOrderCurrency, remainingToAllocate);
        storeCreditAllocated = Number((storeCreditAllocated + allocatedInOrderCurrency).toFixed(4));
        remainingToAllocate = Number((remainingToAllocate - allocatedInOrderCurrency).toFixed(4));
      }
    }

    // 3. Process Loyalty Redemption (Tertiary Priority - Loader Stage)
    let loyaltyPointsAllocated = 0;
    let loyaltyAmountAllocated = 0;
    if (pointsToRedeem > 0 && remainingToAllocate > 0) {
      const { loyaltyRedemptionService } = await import('./LoyaltyRedemptionService.js');
      const calc = await loyaltyRedemptionService.calculatePointsValue({
        userId,
        pointsToRedeem,
        orderCurrency,
      });

      if (calc.pointsRedeemable > 0 && calc.valueInOrderCurrency > 0) {
        let discountApplied = calc.valueInOrderCurrency;
        let pointsUsed = calc.pointsRedeemable;

        if (discountApplied > remainingToAllocate) {
          discountApplied = remainingToAllocate;
          pointsUsed = Math.ceil(discountApplied * (calc.pointsRedeemable / calc.valueInOrderCurrency));
          if (pointsUsed > calc.pointsRedeemable) {
            pointsUsed = calc.pointsRedeemable;
          }
        }

        loyaltyPointsAllocated = pointsUsed;
        loyaltyAmountAllocated = Number(discountApplied.toFixed(4));
        remainingToAllocate = Number((remainingToAllocate - discountApplied).toFixed(4));
      }
    }

    // 4. Leftover belongs to payment gateway
    const gatewayAmountAllocated = remainingToAllocate > 0 ? remainingToAllocate : 0;

    return {
      giftCardAllocations,
      storeCreditAllocated,
      gatewayAmountAllocated,
      orderCurrency,
      exchangeRateVersionId: ratesVersion._id.toString(),
      loyaltyPointsAllocated,
      loyaltyAmountAllocated,
    };
  }

  /**
   * Section 3.6 & 10.5 - Execution engine during actual Checkout.
   * Debits the gift cards & store credit ledger for finalized orders.
   */
  async executeCheckoutLedgers(params: {
    userId: string;
    orderId: string;
    allocations: IAllocationResult;
    notes?: string;
  }): Promise<void> {
    const { userId, orderId, allocations, notes } = params;
    const ratesVersion = await exchangeRateService.getLatestRates();

    // 1. Debit applied gift cards under strict lock isolation
    for (const alloc of allocations.giftCardAllocations) {
      const lockKey = `lock:giftcard:${alloc.giftCardId}`;
      await lockService.withLock(lockKey, 15000, async () => {
        const card = await GiftCard.findById(alloc.giftCardId);
        if (!card) {
          throw new AppError(404, `Critical: Allocated gift card (${alloc.code}) not found.`);
        }

        if (card.balance < alloc.allocatedAmountInCardCurrency) {
          throw new AppError(400, `Critical: Insufficient balance on gift card ${card.code}. Available: ${card.balance}, Required: ${alloc.allocatedAmountInCardCurrency}`);
        }

        // De-escalate card balance
        card.balance = Number((card.balance - alloc.allocatedAmountInCardCurrency).toFixed(4));
        if (card.balance <= 0) {
          card.status = 'REDEEMED';
        }
        await card.save();

        // Safe Audit ledger write
        await GiftCardTransaction.create({
          giftCard: card._id,
          type: 'REDEMPTION',
          amount: -alloc.allocatedAmountInCardCurrency,
          currency: card.currency,
          orderId: new mongoose.Types.ObjectId(orderId),
          note: notes || `Checkout redemption for orderId: ${orderId}`,
          performedBy: userId,
        });
      });
    }

    // 2. Debit applied store credit under strict lock isolation
    if (allocations.storeCreditAllocated > 0) {
      let remainingDebit = allocations.storeCreditAllocated;

      // Retrieve available enabled store credit accounts
      const creditAccounts = await StoreCreditAccount.find({
        user: new mongoose.Types.ObjectId(userId),
        isEnabled: true,
        balance: { $gt: 0 },
      });

      // Prefer matched currency account
      const matchedAccount = creditAccounts.find(a => a.currency === allocations.orderCurrency);
      const otherAccounts = creditAccounts.filter(a => a.currency !== allocations.orderCurrency);
      const accountsInRoute = matchedAccount ? [matchedAccount, ...otherAccounts] : otherAccounts;

      for (const account of accountsInRoute) {
        if (remainingDebit <= 0) {
          break;
        }

        const accountBalanceInOrderCurrency = this.convertCurrency(
          account.balance,
          account.currency,
          allocations.orderCurrency,
          ratesVersion
        );

        if (accountBalanceInOrderCurrency <= 0) {
          continue;
        }

        const debitInOrderCurrency = Math.min(accountBalanceInOrderCurrency, remainingDebit);
        
        // Convert allocation to account's native currency
        let debitInAccountCurrency = this.convertCurrency(
          debitInOrderCurrency,
          allocations.orderCurrency,
          account.currency,
          ratesVersion
        );

        if (debitInAccountCurrency > account.balance) {
          debitInAccountCurrency = account.balance;
        }

        // Debit the account
        await this.debitStoreCredit({
          userId,
          amount: debitInAccountCurrency,
          currency: account.currency,
          orderId,
          notes: notes || `Checkout allocations for order: ${orderId}`,
        });

        remainingDebit = Number((remainingDebit - debitInOrderCurrency).toFixed(4));
      }
    }

    // 3. Debit loyalty redemption ledger under lock isolation (Priority 3)
    if (allocations.loyaltyPointsAllocated && allocations.loyaltyPointsAllocated > 0) {
      const { loyaltyRedemptionService } = await import('./LoyaltyRedemptionService.js');
      await loyaltyRedemptionService.executeRedemptionLedger({
        userId,
        orderId,
        pointsToRedeem: allocations.loyaltyPointsAllocated,
        orderCurrency: allocations.orderCurrency,
      });
    }
  }

  /**
   * Section 5.6 - Refund Allocation & Priority Engine
   * Calculates how a refund amount will be allocated back across original payment sources (deterministic prioritizations).
   * sequence priority:
   * 1. Refund to Gateway FIRST (reduces stripe/razorpay merchant charge liability logs)
   * 2. Refund to Store Credit SECOND
   * 3. Refund to Gift Cards THIRD
   */
  calculateRefundDistribution(params: {
    refundAmount: number; // amount requesting to refund (in order's currency)
    orderTotal: number;
    allocatedGateway: number;
    allocatedStoreCredit: number;
    allocatedGiftCards: { giftCardId: string; code: string; amount: number }[];
    alreadyRefundedGateway: number;
    alreadyRefundedStoreCredit: number;
    alreadyRefundedGiftCards: Record<string, number>; // giftCardId -> amount refunded in order's currency
  }): {
    gatewayRefundAmount: number;
    storeCreditRefundAmount: number;
    giftCardRefunds: { giftCardId: string; code: string; refundAmount: number }[];
  } {
    let remainingToDistributed = params.refundAmount;

    // Gateway allocations distribution limit values
    const maxGatewayRefundable = Math.max(0, params.allocatedGateway - params.alreadyRefundedGateway);
    const gatewayRefundAmount = Math.min(maxGatewayRefundable, remainingToDistributed);
    remainingToDistributed = Number((remainingToDistributed - gatewayRefundAmount).toFixed(4));

    // Store Credit allocation distribution limit values
    let storeCreditRefundAmount = 0;
    if (remainingToDistributed > 0) {
      const maxCreditRefundable = Math.max(0, params.allocatedStoreCredit - params.alreadyRefundedStoreCredit);
      storeCreditRefundAmount = Math.min(maxCreditRefundable, remainingToDistributed);
      remainingToDistributed = Number((remainingToDistributed - storeCreditRefundAmount).toFixed(4));
    }

    // Gift cards allocation limits
    const giftCardRefunds: { giftCardId: string; code: string; refundAmount: number }[] = [];
    if (remainingToDistributed > 0) {
      for (const cardAlloc of params.allocatedGiftCards) {
        if (remainingToDistributed <= 0) {
          break;
        }
        const alreadyRefunded = params.alreadyRefundedGiftCards[cardAlloc.giftCardId] || 0;
        const maxCardRefundable = Math.max(0, cardAlloc.amount - alreadyRefunded);
        const cardRefund = Math.min(maxCardRefundable, remainingToDistributed);

        if (cardRefund > 0) {
          giftCardRefunds.push({
            giftCardId: cardAlloc.giftCardId,
            code: cardAlloc.code,
            refundAmount: Number(cardRefund.toFixed(4)),
          });
          remainingToDistributed = Number((remainingToDistributed - cardRefund).toFixed(4));
        }
      }
    }

    return {
      gatewayRefundAmount: Number(gatewayRefundAmount.toFixed(4)),
      storeCreditRefundAmount: Number(storeCreditRefundAmount.toFixed(4)),
      giftCardRefunds,
    };
  }
}

export const giftCardCreditService = new GiftCardCreditService();
