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
    onMutate: async ({ variantSku, quantity }) => {
      if (user) {
        await queryClient.cancelQueries({ queryKey: ['cart'] });
        const previousCart = queryClient.getQueryData(['cart']);
        queryClient.setQueryData(['cart'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.variantSku === variantSku ? { ...item, quantity } : item
            ),
          };
        });
        return { previousCart };
      }
    },
    onError: (err, variables, context: any) => {
      if (user && context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
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
    onMutate: async (variantSku) => {
      if (user) {
        await queryClient.cancelQueries({ queryKey: ['cart'] });
        const previousCart = queryClient.getQueryData(['cart']);
        queryClient.setQueryData(['cart'], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item: any) => item.variantSku !== variantSku),
          };
        });
        return { previousCart };
      }
    },
    onError: (err, variables, context: any) => {
      if (user && context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
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
