import { apiClient } from './apiClient.js';
import { RecentlyViewed } from '../types/index.js';

export const getRecentlyViewed = async (): Promise<RecentlyViewed> => {
  const { data } = await apiClient.get('/recently-viewed');
  return data;
};

export const addRecentlyViewed = async (productId: string): Promise<RecentlyViewed> => {
  const { data } = await apiClient.post(`/recently-viewed/${productId}`);
  return data;
};
