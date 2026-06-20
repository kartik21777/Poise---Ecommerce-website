import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { categoryService } from '../services/categoryService.js';
import { toCategoryDto } from '../dtos/categoryDto.js';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json(toCategoryDto(category));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(toCategoryDto(category));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);
  res.status(204).send();
});

export const getActiveCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.getActiveCategories();
  res.status(200).json(categories.map(toCategoryDto));
});

export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.status(200).json(categories.map(toCategoryDto));
});

export const getCategoryBySlug = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryBySlug(req.params.slug);
  res.status(200).json(toCategoryDto(category));
});
