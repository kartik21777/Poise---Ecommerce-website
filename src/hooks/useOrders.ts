import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as orderService from '../services/orderService.js';

export const useCheckoutPreview = (shippingAddressId?: string, couponCode?: string) => {
  return useQuery({
    queryKey: ['checkout-preview', shippingAddressId, couponCode],
    queryFn: () => orderService.getCheckoutPreview(shippingAddressId, couponCode),
    retry: false,
    staleTime: 5000,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      shippingAddressId,
      giftCardCodes,
      useStoreCredit,
      couponCode,
    }: {
      shippingAddressId: string;
      giftCardCodes?: string[];
      useStoreCredit?: boolean;
      couponCode?: string;
    }) => orderService.createOrder(shippingAddressId, giftCardCodes, useStoreCredit, couponCode),
    onSuccess: () => {
      // Clear cart queries and invalidate ordering context
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => orderService.getMyOrders(),
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderService.getMyOrderDetails(id),
    enabled: !!id,
  });
};

export const useAdminOrders = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderService.getAdminOrders(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      paymentStatus,
    }: {
      id: string;
      status?: string;
      paymentStatus?: string;
    }) => orderService.updateOrderStatus(id, status, paymentStatus),
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', updatedOrder.id] });
    },
  });

  return {
    orders: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
};
