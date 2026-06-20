import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as rvService from '../services/recentlyViewedService.js';
import { toRecentlyViewedDto } from '../dtos/recentlyViewedDto.js';

export const getRecentlyViewed = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rv = await rvService.getRecentlyViewed(req.user!.id);
  res.json(toRecentlyViewedDto(rv));
});

export const addRecentlyViewed = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const rv = await rvService.addRecentlyViewed(req.user!.id, productId);
  res.json(toRecentlyViewedDto(rv));
});
