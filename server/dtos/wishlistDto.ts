import { IWishlist } from '../models/Wishlist.js';
import { IProduct } from '../models/Product.js';
import { ProductResponse, toProductDto } from './productDto.js';

export interface WishlistResponse {
  id: string;
  user: string;
  products: (ProductResponse | string)[];
  createdAt: string;
  updatedAt: string;
}

export const toWishlistDto = (wishlist: IWishlist): WishlistResponse => {
  const products = wishlist.products.map((p: any) => {
    if (p && typeof p === 'object' && 'name' in p) {
      return toProductDto(p as IProduct);
    }
    return p.toString();
  });

  return {
    id: wishlist._id.toString(),
    user: wishlist.user.toString(),
    products,
    createdAt: wishlist.createdAt.toISOString(),
    updatedAt: wishlist.updatedAt.toISOString(),
  };
};
