import { apiClient } from './apiClient.js';
import { Cart, SyncCartItem } from '../types/index.js';

export const getCart = async (): Promise<Cart> => {
  const { data } = await apiClient.get('/cart');
  return data;
};

export const addItem = async (productId: string, variantSku: string, quantity: number): Promise<Cart> => {
  const { data } = await apiClient.post('/cart/items', { productId, variantSku, quantity });
  return data;
};

export const updateItem = async (variantSku: string, quantity: number): Promise<Cart> => {
  const { data } = await apiClient.put(`/cart/items/${variantSku}`, { quantity });
  return data;
};

export const removeItem = async (variantSku: string): Promise<Cart> => {
  const { data } = await apiClient.delete(`/cart/items/${variantSku}`);
  return data;
};

export const clearCart = async (): Promise<Cart> => {
  const { data } = await apiClient.delete('/cart');
  return data;
};

export const syncCart = async (items: SyncCartItem[]): Promise<Cart> => {
  const { data } = await apiClient.post('/cart/sync', { items });
  return data;
};
