import { apiClient } from './apiClient.js';
import { Product, PaginatedResponse, ProductSearchQuery } from '../types/index.js';

export const getProducts = async (params: ProductSearchQuery = {}): Promise<PaginatedResponse<Product>> => {
  const { data } = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
  return data;
};

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await apiClient.get<Product>(`/products/${slug}`);
  return data;
};

export const getFeaturedProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products/featured');
  return data;
};

export const getNewArrivals = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products/new-arrivals');
  return data;
};

export const getBestSellers = async (): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>('/products/best-sellers');
  return data;
};

export const getRelatedProducts = async (slug: string): Promise<Product[]> => {
  const { data } = await apiClient.get<Product[]>(`/products/${slug}/related`);
  return data;
};
