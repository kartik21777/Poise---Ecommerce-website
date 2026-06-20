import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as cartService from '../services/cartService.js';
import { toCartDto } from '../dtos/cartDto.js';

/**
 * Extracts structural geolocation context from active headers or fallback search params
 */
const getRegionalContext = (req: Request) => {
  const targetCurrency = (req.headers['x-currency'] as string) || (req.query.currency as string) || 'USD';
  const countryCode = (req.headers['x-country-code'] as string) || (req.query.country as string);
  return { targetCurrency, countryCode };
};

export const getCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.getCart(req.user!.id, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});

export const addItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId, variantSku, quantity } = req.body;
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.addItemToCart(req.user!.id, productId, variantSku, quantity, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});

export const updateItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: variantSku } = req.params;
  const { quantity } = req.body;
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.updateCartItem(req.user!.id, variantSku, quantity, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});

export const removeItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: variantSku } = req.params;
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.removeCartItem(req.user!.id, variantSku, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});

export const clearCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await cartService.clearCart(req.user!.id);
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.getCart(req.user!.id, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});

export const syncCart = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { items } = req.body;
  const { targetCurrency, countryCode } = getRegionalContext(req);
  const cart = await cartService.syncCart(req.user!.id, items, targetCurrency, countryCode);
  res.json(toCartDto(cart));
});
