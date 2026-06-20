import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { productService, ProductError } from '../services/productService.js';
import { toProductDto } from '../dtos/productDto.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { removeImageFromCloudinary } from '../services/cloudinaryService.js';

export const uploadProductImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }

  // Upload to cloudinary using buffer stream
  const uploadPromise = new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(req.file!.buffer);
  });

  const result: any = await uploadPromise;
  res.status(200).json({
    public_id: result.public_id,
    secure_url: result.secure_url,
    url: result.secure_url, // some frontend expects url
  });
});

export const deleteProductImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { public_id } = req.body;
  if (!public_id) {
    res.status(400);
    throw new Error('public_id is required');
  }

  await removeImageFromCloudinary(public_id);
  res.status(204).send();
});

export const createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productService.createProduct(req.body, req.user!._id.toString());
    res.status(201).json(toProductDto(product));
  } catch (error) {
    if (error instanceof ProductError) {
      res.status(error.statusCode);
    }
    throw error;
  }
});

export const updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body, req.user!._id.toString());
    res.status(200).json(toProductDto(product));
  } catch (error) {
    if (error instanceof ProductError) {
      res.status(error.statusCode);
    }
    throw error;
  }
});

export const deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    await productService.deleteProduct(req.params.id, req.user!._id.toString());
    res.status(204).send();
  } catch (error) {
    if (error instanceof ProductError) {
      res.status(error.statusCode);
    }
    throw error;
  }
});

export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Direct count queries are faster anyway. Let's use mongoose model directly.
  const mongoose = await import('mongoose');
  const Product = mongoose.model('Product');

  const countsResult = await Promise.all([
    Product.countDocuments({ status: { $ne: 'archived' } }),
    Product.countDocuments({ status: 'active' }),
    Product.countDocuments({ isFeatured: true, status: { $ne: 'archived' } }),
    Product.aggregate([
      { $match: { status: { $ne: 'archived' } } },
      { $unwind: "$variants" },
      { $group: { _id: "$_id", totalStock: { $sum: "$variants.stock" }, threshold: { $first: "$lowStockThreshold" } } },
      { $match: { $expr: { $lte: ["$totalStock", "$threshold"] } } },
      { $count: "count" }
    ])
  ]);

  res.status(200).json({
    total: countsResult[0],
    published: countsResult[1],
    featured: countsResult[2],
    lowStock: countsResult[3][0]?.count || 0
  });
});
export const getAdminProductById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const product = await productService.getProductById(req.params.id, true);
  res.status(200).json(toProductDto(product));
});

export const getAdminProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await productService.searchProducts(req.query as any, true);
  res.status(200).json({
    ...result,
    data: result.data.map(p => toProductDto(p)),
  });
});

