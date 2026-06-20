import { apiClient } from './apiClient.js';
import { AuthResponse, User } from '../types/index.js';

export const register = async (payload: any): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
};

export const login = async (payload: any): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
};

export const logout = async (): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/logout');
  return data;
};

export const getMe = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.get<AuthResponse>('/auth/me');
  return data;
};

export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
};

export const resetPassword = async (payload: any & { token: string }): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/auth/reset-password/${payload.token}`, payload);
  return data;
};

export const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/auth/verify-email/${token}`);
  return data;
};
