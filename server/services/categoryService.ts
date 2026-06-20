import { Category, ICategory } from '../models/Category.js';
import { slugify, generateUniqueSlug } from '../utils/slugify.js';
import { removeImageFromCloudinary, extractPublicIdFromUrl } from './cloudinaryService.js';
import { CreateCategoryInput, UpdateCategoryInput } from '../validations/categoryValidation.js';

export class CategoryError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'CategoryError';
  }
}

export const categoryService = {
  async createCategory(data: CreateCategoryInput): Promise<ICategory> {
    const baseSlug = data.slug ? slugify(data.slug) : slugify(data.name);
    const slug = await generateUniqueSlug(Category, baseSlug);

    const category = await Category.create({ ...data, slug });
    return category;
  },

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<ICategory> {
    const category = await Category.findById(id);
    if (!category) {
      throw new CategoryError('Category not found', 404);
    }

    if (data.name && !data.slug) {
      // Preserve existing slug unless explicitly changed
    }

    if (data.slug) {
      const baseSlug = slugify(data.slug);
      data.slug = await generateUniqueSlug(Category, baseSlug, id);
    }

    let oldImagePublicId: string | null = null;
    if (data.image !== undefined && data.image !== category.image) {
       if (category.image) {
         oldImagePublicId = extractPublicIdFromUrl(category.image);
       }
    }

    Object.assign(category, data);
    await category.save();

    if (oldImagePublicId) {
      removeImageFromCloudinary(oldImagePublicId);
    }

    return category;
  },

  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw new CategoryError('Category not found', 404);
    }

    let imagePublicId: string | null = null;
    if (category.image) {
       imagePublicId = extractPublicIdFromUrl(category.image);
    }

    await Category.deleteOne({ _id: id });

    if (imagePublicId) {
       removeImageFromCloudinary(imagePublicId);
    }
  },

  async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await Category.findOne({ slug, isActive: true });
    if (!category) {
      throw new CategoryError('Category not found', 404);
    }
    return category;
  },

  async getActiveCategories(): Promise<ICategory[]> {
    return Category.find({ isActive: true }).sort({ name: 1 });
  },

  async getAllCategories(): Promise<ICategory[]> {
    return Category.find({}).sort({ name: 1 });
  }
};

