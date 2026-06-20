import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { productService, ProductError } from '../services/productService.js';
import { toProductDto } from '../dtos/productDto.js';

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.searchProducts(req.query as any, false);
  res.status(200).json({
    ...result,
    data: result.data.map(p => toProductDto(p)),
  });
});

export const getProductBySlug = asyncHandler(async (req: Request, res: Response) => {
  try {
    const product = await productService.getProductBySlug(req.params.slug);
    res.status(200).json(toProductDto(product));
  } catch (error) {
    if (error instanceof ProductError) {
      res.status(error.statusCode);
    }
    throw error;
  }
});

export const getFeaturedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getFeaturedProducts();
  res.status(200).json(products.map(p => toProductDto(p)));
});

export const getNewArrivals = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getNewArrivals();
  res.status(200).json(products.map(p => toProductDto(p)));
});

export const getBestSellers = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getBestSellers();
  res.status(200).json(products.map(p => toProductDto(p)));
});

export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productService.getRelatedProducts(req.params.slug);
  res.status(200).json(products.map(p => toProductDto(p)));
});

