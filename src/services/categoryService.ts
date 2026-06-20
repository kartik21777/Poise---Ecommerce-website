import { apiClient } from './apiClient.js';
import { Category } from '../types/index.js';

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
};

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const { data } = await apiClient.get<Category>(`/categories/${slug}`);
  return data;
};
