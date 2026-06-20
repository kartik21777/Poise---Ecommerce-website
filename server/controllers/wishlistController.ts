import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as wishlistService from '../services/wishlistService.js';
import { toWishlistDto } from '../dtos/wishlistDto.js';

export const getWishlist = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const wishlist = await wishlistService.getWishlist(req.user!.id);
  res.json(toWishlistDto(wishlist));
});

export const addItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const wishlist = await wishlistService.addWishlistItem(req.user!.id, productId);
  res.json(toWishlistDto(wishlist));
});

export const removeItem = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const wishlist = await wishlistService.removeWishlistItem(req.user!.id, productId);
  res.json(toWishlistDto(wishlist));
});
