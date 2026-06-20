import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient.js';
import { Product } from '../types/index.js';

export const useAdminProducts = (params: any) => {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/products', { params });
      return data;
    },
  });
};

export const useAdminProduct = (id: string) => {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/products/${id}`);
      return data;
    },
    enabled: !!id && id !== 'new'
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/admin/products', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: any }) => {
      const { data } = await apiClient.put(`/admin/products/${id}`, payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', data.id] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    }
  });
};
