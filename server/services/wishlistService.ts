import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';

export const getWishlist = async (userId: string) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, products: [] });
  }
  return wishlist;
};

export const addWishlistItem = async (userId: string, productId: string) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $addToSet: { products: productId } },
    { new: true, upsert: true }
  ).populate('products');

  return wishlist;
};

export const removeWishlistItem = async (userId: string, productId: string) => {
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: userId },
    { $pull: { products: productId } },
    { new: true }
  ).populate('products');

  if (!wishlist) throw new AppError(404, 'Wishlist not found');

  return wishlist;
};
