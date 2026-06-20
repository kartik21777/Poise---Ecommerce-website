import { apiClient } from './apiClient.js';
import { Wishlist } from '../types/index.js';

export const getWishlist = async (): Promise<Wishlist> => {
  const { data } = await apiClient.get('/wishlist');
  return data;
};

export const addItem = async (productId: string): Promise<Wishlist> => {
  const { data } = await apiClient.post(`/wishlist/${productId}`);
  return data;
};

export const removeItem = async (productId: string): Promise<Wishlist> => {
  const { data } = await apiClient.delete(`/wishlist/${productId}`);
  return data;
};
