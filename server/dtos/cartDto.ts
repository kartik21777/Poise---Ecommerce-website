import { ICart, ICartItem } from '../models/Cart.js';
import { IProduct } from '../models/Product.js';
import { ProductResponse, toProductDto } from './productDto.js';

export interface CartItemResponse {
  id: string; // The cart item _id
  product: ProductResponse | string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CartResponse {
  id: string;
  user: string;
  items: CartItemResponse[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export const toCartDto = (cart: ICart): CartResponse => {
  let totalItems = 0;
  let totalPrice = 0;

  const items = cart.items.map((item: any) => {
    totalItems += item.quantity;
    const subtotal = item.quantity * item.unitPrice;
    totalPrice += subtotal;

    let productDto: ProductResponse | string = item.product.toString();
    
    if (item.product && typeof item.product === 'object' && 'name' in item.product) {
      productDto = toProductDto(item.product as IProduct);
    }

    return {
      id: item._id.toString(),
      product: productDto,
      variantSku: item.variantSku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal
    };
  });

  return {
    id: cart._id.toString(),
    user: cart.user.toString(),
    items,
    totalItems,
    totalPrice,
    createdAt: cart.createdAt.toISOString(),
    updatedAt: cart.updatedAt.toISOString(),
  };
};
