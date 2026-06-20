import { SyncCartItem } from '../types/index.js';

const GUEST_CART_KEY = 'guest_cart';

export const getGuestCart = (): SyncCartItem[] => {
  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveGuestCart = (items: SyncCartItem[]) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const clearGuestCart = () => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const addGuestItem = (item: SyncCartItem) => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(i => i.productId === item.productId && i.variantSku === item.variantSku);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveGuestCart(cart);
  return cart;
};

export const updateGuestItem = (variantSku: string, quantity: number) => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(i => i.variantSku === variantSku);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity = quantity;
    saveGuestCart(cart);
  }
  return cart;
};

export const removeGuestItem = (variantSku: string) => {
  let cart = getGuestCart();
  cart = cart.filter(i => i.variantSku !== variantSku);
  saveGuestCart(cart);
  return cart;
};
