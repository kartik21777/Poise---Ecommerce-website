import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cartService from '../services/cartService.js';
import * as guestCartService from '../services/guestCartService.js';
import { useAuth } from '../providers/AuthProvider.js';
import { SyncCartItem, Cart } from '../types/index.js';
import { useLocalStorage } from './useLocalStorage.js';

export const useCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
    enabled: !!user,
  });

  const [guestCartItems, setGuestCartItems] = useLocalStorage<SyncCartItem[]>('guest_cart', []);

  const addItemMutation = useMutation({
    mutationFn: async (item: SyncCartItem) => {
      if (user) {
        return cartService.addItem(item.productId, item.variantSku, item.quantity);
      } else {
        const cart = guestCartService.addGuestItem(item);
        setGuestCartItems(cart);
        return null;
      }
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ variantSku, quantity }: { variantSku: string; quantity: number }) => {
      if (user) {
        return cartService.updateItem(variantSku, quantity);
      } else {
        const cart = guestCartService.updateGuestItem(variantSku, quantity);
        setGuestCartItems(cart);
        return null;
      }
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (variantSku: string) => {
      if (user) {
        return cartService.removeItem(variantSku);
      } else {
        const cart = guestCartService.removeGuestItem(variantSku);
        setGuestCartItems(cart);
        return null;
      }
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        return cartService.clearCart();
      } else {
        guestCartService.clearGuestCart();
        setGuestCartItems([]);
        return null;
      }
    },
    onSuccess: () => {
      if (user) queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart: user ? query.data : null,
    guestCartItems: !user ? guestCartItems : [],
    isLoading: user ? query.isLoading : false,
    addItem: addItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
  };
};
