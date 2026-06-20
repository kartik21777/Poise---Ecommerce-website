import { IRecentlyViewed, IRecentlyViewedItem } from '../models/RecentlyViewed.js';
import { IProduct } from '../models/Product.js';
import { ProductResponse, toProductDto } from './productDto.js';

export interface RecentlyViewedItemResponse {
  product: ProductResponse | string;
  viewedAt: string;
}

export interface RecentlyViewedResponse {
  id: string;
  user: string;
  items: RecentlyViewedItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export const toRecentlyViewedDto = (rv: IRecentlyViewed): RecentlyViewedResponse => {
  const items = rv.items.map((item: any) => {
    let productDto: ProductResponse | string = item.product.toString();
    if (item.product && typeof item.product === 'object' && 'name' in item.product) {
      productDto = toProductDto(item.product as IProduct);
    }
    return {
      product: productDto,
      viewedAt: item.viewedAt.toISOString(),
    };
  });

  return {
    id: rv._id.toString(),
    user: rv.user.toString(),
    items,
    createdAt: rv.createdAt.toISOString(),
    updatedAt: rv.updatedAt.toISOString(),
  };
};
