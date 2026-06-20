import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as wishlistService from '../services/wishlistService.js';
import { useAuth } from '../providers/AuthProvider.js';

export const useWishlist = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistService.getWishlist(),
    enabled: !!user,
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ productId, isAdding }: { productId: string; isAdding: boolean }) => {
      if (isAdding) {
        return wishlistService.addItem(productId);
      } else {
        return wishlistService.removeItem(productId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  return {
    wishlist: query.data,
    isLoading: query.isLoading,
    toggleItem: toggleItemMutation.mutateAsync,
    isInWishlist: (productId: string) => {
      if (!query.data) return false;
      return query.data.products.some((p: any) => 
        (typeof p === 'string' ? p : p.id) === productId
      );
    }
  };
};
