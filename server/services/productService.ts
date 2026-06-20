import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';
import { slugify, generateUniqueSlug } from '../utils/slugify.js';
import { removeImageFromCloudinary } from './cloudinaryService.js';
import { ProductSearchQuery, CreateProductInput, UpdateProductInput } from '../validations/productValidation.js';
import { escapeRegex } from '../utils/regexUtils.js';

export class ProductError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ProductError';
  }
}

interface PaginationResult<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const productService = {
  async createProduct(data: CreateProductInput, userId: string): Promise<IProduct> {
    const baseSlug = data.slug ? slugify(data.slug) : slugify(data.name);
    const slug = await generateUniqueSlug(Product, baseSlug);

    // SKU uniqueness validation
    if (data.variants && data.variants.length > 0) {
      const skus = data.variants.map(v => v.sku);
      if (new Set(skus).size !== skus.length) {
        throw new ProductError('Duplicate SKUs found in variant array', 400);
      }
      const existingSku = await Product.findOne({ 'variants.sku': { $in: skus } });
      if (existingSku) {
        throw new ProductError('One or more SKUs are already in use', 409);
      }
    }

    const product = await Product.create({ ...data, slug, createdBy: userId });
    return product;
  },

  async updateProduct(id: string, data: UpdateProductInput, userId: string): Promise<IProduct> {
    const product = await Product.findById(id);
    if (!product || product.status === 'archived') {
      throw new ProductError('Product not found or is archived', 404);
    }

    if (data.slug) {
      const baseSlug = slugify(data.slug);
      data.slug = await generateUniqueSlug(Product, baseSlug, id);
    }

    let imagesToDelete: string[] = [];

    // SKU validation if updating variants
    if (data.variants) {
      const skus = data.variants.map(v => v.sku);
      if (new Set(skus).size !== skus.length) {
        throw new ProductError('Duplicate SKUs found in variant array', 400);
      }
      const existingSku = await Product.findOne({ 'variants.sku': { $in: skus }, _id: { $ne: id } });
      if (existingSku) {
        throw new ProductError('One or more SKUs are already in use by another product', 409);
      }

      // Check for removed images to cleanup from Cloudinary
      // Find old vs new public IDs
      const oldImageIds = new Set([
        ...product.images.map(img => img.public_id),
        ...product.variants.flatMap(v => v.images.map(img => img.public_id))
      ]);
      const newImageIds = new Set([
        ...(data.images || []).map(img => img.public_id),
        ...(data.variants || []).flatMap(v => (v.images || []).map(img => img.public_id))
      ]);

      imagesToDelete = Array.from(oldImageIds).filter(imgId => !newImageIds.has(imgId));
    }

    Object.assign(product, data);
    product.updatedBy = userId as any;
    
    // Save first to ensure DB matches new state
    await product.save();

    // Now cleanup unused Cloudinary images
    if (imagesToDelete.length > 0) {
      imagesToDelete.forEach(imgId => {
        removeImageFromCloudinary(imgId);
      });
    }

    return product;
  },

  async deleteProduct(id: string, userId: string): Promise<void> {
    const product = await Product.findById(id);
    if (!product) {
      throw new ProductError('Product not found', 404);
    }

    product.status = 'archived';
    product.deletedAt = new Date();
    product.deletedBy = userId as any;
    
    await product.save();
  },

  async getProductById(id: string, isAdmin: boolean = false): Promise<IProduct> {
    const filter: any = { _id: id };
    if (!isAdmin) {
      filter.status = 'active';
    }
    const product = await Product.findOne(filter).populate('category');
    if (!product) {
      throw new ProductError('Product not found', 404);
    }
    return product;
  },

  async getProductBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug, status: 'active' }).populate('category');
    if (!product) {
      throw new ProductError('Product not found', 404);
    }
    
    // Increment view counts asynchronously
    Product.updateOne({ _id: product._id }, { $inc: { viewCount: 1 } }).exec();
    
    return product;
  },

  async searchProducts(query: ProductSearchQuery, isAdmin: boolean = false): Promise<PaginationResult<IProduct>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (!isAdmin) {
      filter.status = 'active';
    }

    if (query.q) {
      // Use text index if we wanted to: filter.$text = { $search: query.q };
      // Fallback to safely escaped regex if partial match is preferred
      const safeQuery = escapeRegex(query.q);
      filter.$or = [
        { name: { $regex: safeQuery, $options: 'i' } },
        { description: { $regex: safeQuery, $options: 'i' } }
      ];
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.brand) {
      filter.brand = query.brand;
    }
    if (query.tag) {
      filter.tags = query.tag;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    let sortOption: any = { createdAt: -1 };
    if (query.sort === 'price-asc') sortOption = { price: 1 };
    if (query.sort === 'price-desc') sortOption = { price: -1 };
    if (query.sort === 'oldest') sortOption = { createdAt: 1 };
    if (query.sort === 'featured') sortOption = { isFeatured: -1, createdAt: -1 };

    const [products, totalItems] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit).populate('category'),
      Product.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: products,
      currentPage: page,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  },

  async getFeaturedProducts(): Promise<IProduct[]> {
    return Product.find({ isFeatured: true, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('category');
  },

  async getNewArrivals(): Promise<IProduct[]> {
    return Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('category');
  },

  async getBestSellers(): Promise<IProduct[]> {
    return Product.find({ status: 'active', salesCount: { $gt: 0 } })
      .sort({ salesCount: -1 })
      .limit(10)
      .populate('category');
  },

  async getRelatedProducts(slug: string): Promise<IProduct[]> {
    const product = await Product.findOne({ slug });
    if (!product) return [];

    return Product.find({
      _id: { $ne: product._id },
      status: 'active',
      $or: [
        { category: product.category },
        { tags: { $in: product.tags } }
      ]
    })
    .sort({ salesCount: -1 })
    .limit(4)
    .populate('category');
  }
};

