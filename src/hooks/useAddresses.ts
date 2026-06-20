import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as addressService from '../services/addressService.js';
import { CreateAddressInput } from '../types/index.js';

export const useAddresses = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressService.getAddresses(),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: CreateAddressInput) => addressService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAddressInput> }) =>
      addressService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });

  return {
    addresses: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createAddress: createAddressMutation.mutateAsync,
    isCreating: createAddressMutation.isPending,
    updateAddress: updateAddressMutation.mutateAsync,
    isUpdating: updateAddressMutation.isPending,
    deleteAddress: deleteAddressMutation.mutateAsync,
    isDeleting: deleteAddressMutation.isPending,
  };
};
