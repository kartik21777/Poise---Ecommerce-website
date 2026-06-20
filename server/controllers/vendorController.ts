import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Vendor } from '../models/Vendor.js';
import { Product } from '../models/Product.js';
import { VendorOrder } from '../models/VendorOrder.js';
import { VendorPayout } from '../models/VendorPayout.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getMyVendorProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) {
    throw new AppError(404, 'Vendor profile not found');
  }
  res.json(vendor);
});

export const updateMyVendorProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) {
    throw new AppError(404, 'Vendor profile not found');
  }
  const { businessName, legalName, phone, businessAddress, taxId } = req.body;
  if (businessName) vendor.businessName = businessName;
  if (legalName) vendor.legalName = legalName;
  if (phone) vendor.phone = phone;
  if (businessAddress) vendor.businessAddress = businessAddress;
  if (taxId) vendor.taxId = taxId;

  await vendor.save();
  res.json(vendor);
});

export const getVendorProducts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  const products = await Product.find({ ownershipType: 'VENDOR', vendorId: vendor._id }).sort({ createdAt: -1 });
  res.json(products);
});

export const createVendorProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');
  if (vendor.status !== 'ACTIVE') throw new AppError(403, 'Vendor account is not active');

  const payload = req.body;
  
  // Enforce ownership
  payload.ownershipType = 'VENDOR';
  payload.vendorId = vendor._id;

  // We should ideally generate a slug if not provided, just basic fallback
  if (!payload.slug && payload.name) {
    const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    payload.slug = slugify(payload.name) + '-' + Date.now();
  }

  const product = new Product(payload);
  await product.save();
  res.status(201).json(product);
});

export const updateVendorProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  const product = await Product.findOne({ _id: req.params.id, vendorId: vendor._id, ownershipType: 'VENDOR' });
  if (!product) throw new AppError(404, 'Product not found or access denied');

  const payload = req.body;
  
  // Prevent tampering with ownership
  delete payload.ownershipType;
  delete payload.vendorId;

  Object.assign(product, payload);
  await product.save();
  
  res.json(product);
});

export const deleteVendorProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  const product = await Product.findOne({ _id: req.params.id, vendorId: vendor._id, ownershipType: 'VENDOR' });
  if (!product) throw new AppError(404, 'Product not found or access denied');

  product.status = 'archived';
  product.deletedAt = new Date();
  await product.save();

  res.status(204).send();
});

export const getVendorOrders = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  const { status, limit = '50', page = '1' } = req.query;
  const match: any = { vendorId: vendor._id };
  if (status) match.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await VendorOrder.find(match)
    .populate('customerUserId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
    
  const total = await VendorOrder.countDocuments(match);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const getVendorPayouts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  const payouts = await VendorPayout.find({ vendorId: vendor._id }).sort({ periodStart: -1 });
  res.json(payouts);
});

export const getVendorAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const vendor = await Vendor.findOne({ ownerUser: req.user!._id });
  if (!vendor) throw new AppError(404, 'Vendor profile not found');

  // Basic analytics using aggregation
  const metrics = await VendorOrder.aggregate([
    { $match: { vendorId: vendor._id, status: { $ne: 'CANCELLED' } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        netRevenue: { $sum: '$netVendorRevenue' },
        totalOrders: { $sum: 1 },
      }
    }
  ]);

  const result = metrics.length > 0 ? metrics[0] : { totalRevenue: 0, netRevenue: 0, totalOrders: 0 };
  res.json(result);
});

// Admin Controllers
export const adminGetAllVendors = asyncHandler(async (req: Request, res: Response) => {
  const vendors = await Vendor.find().populate('ownerUser', 'name email').sort({ createdAt: -1 });
  res.json(vendors);
});

export const adminUpdateVendorStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, isVerified, commissionRate } = req.body;
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new AppError(404, 'Vendor not found');
  
  if (status) vendor.status = status;
  if (isVerified !== undefined) vendor.isVerified = isVerified;
  if (commissionRate !== undefined) vendor.commissionRate = commissionRate;

  await vendor.save();
  res.json(vendor);
});
