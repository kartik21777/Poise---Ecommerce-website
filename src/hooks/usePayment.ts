import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as paymentService from '../services/paymentService.js';

/**
 * Hook to initialize a new checkout payment session of an unpaid order
 */
export const useCreatePaymentSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, gateway }: { orderId: string; gateway?: 'RAZORPAY' | 'STRIPE' }) => 
      paymentService.createPaymentSession(orderId, gateway),
    onSuccess: (_, variables) => {
      // Invalidate target order context to update attempt logs
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['payment-transactions', variables.orderId] });
    },
  });
};

/**
 * Hook to retrieve transaction attempts for a specific order
 * Stale transactions are polled intermittently during active checkout flows
 */
export const usePaymentStatus = (orderId: string, isPollingEnabled: boolean = false) => {
  return useQuery({
    queryKey: ['payment-transactions', orderId],
    queryFn: () => paymentService.getOrderTransactions(orderId),
    enabled: !!orderId,
    // Poll every 3 seconds if the client is actively waiting for webhook capture completion
    refetchInterval: isPollingEnabled ? 3000 : false,
  });
};

/**
 * Admin view of overall platform transaction records
 */
export const useAdminTransactions = (filters?: { status?: string; gateway?: string; orderId?: string }) => {
  return useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: () => paymentService.getAdminTransactions(filters),
  });
};
