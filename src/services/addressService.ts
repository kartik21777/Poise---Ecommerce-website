import { apiClient } from './apiClient.js';
import { Address, CreateAddressInput } from '../types/index.js';

export const getAddresses = async (): Promise<Address[]> => {
  const response = await apiClient.get<Address[]>('/addresses');
  return response.data;
};

export const createAddress = async (data: CreateAddressInput): Promise<Address> => {
  const response = await apiClient.post<Address>('/addresses', data);
  return response.data;
};

export const updateAddress = async (id: string, data: Partial<CreateAddressInput>): Promise<Address> => {
  const response = await apiClient.put<Address>(`/addresses/${id}`, data);
  return response.data;
};

export const deleteAddress = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete<{ success: boolean; message: string }>(`/addresses/${id}`);
  return response.data;
};
