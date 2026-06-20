import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { priceResolutionService } from './PriceResolutionService.js';

const CART_ITEM_LIMIT = 50;

/**
 * Validates inventory for a given product and variant
 */
const validateInventory = async (productId: string, variantSku: string, requestedQuantity: number) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, 'Product not found');
  }
  if (product.status !== 'active') {
    throw new AppError(400, 'Product is not available for purchase');
  }

  const variant = product.variants.find(v => v.sku === variantSku);
  if (!variant) {
    throw new AppError(404, 'Variant not found');
  }

  if (variant.stock < requestedQuantity) {
    throw new AppError(400, `Only ${variant.stock} items left in stock for this variant`);
  }

  return { product, variant };
};

/**
 * Get active cart. Force matches and mutates unit prices to fit the target currency.
 */
export const getCart = async (userId: string, targetCurrency: string = 'USD', countryCode?: string) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Enforce Dynamic Currency Conversion Sync on entire cart!
  const syncCurrency = targetCurrency.toUpperCase();
  let modifiedItem = false;

  for (const item of cart.items) {
    const product = item.product as any;
    if (product && typeof product === 'object') {
      const priceResult = await priceResolutionService.resolveProductPrice(
        product._id,
        item.variantSku,
        syncCurrency,
        countryCode
      );
      if (item.unitPrice !== priceResult.finalPrice) {
        item.unitPrice = priceResult.finalPrice;
        modifiedItem = true;
      }
    }
  }

  if (modifiedItem) {
    await cart.save();
  }

  return cart;
};

export const addItemToCart = async (
  userId: string,
  productId: string,
  variantSku: string,
  quantity: number,
  targetCurrency: string = 'USD',
  countryCode?: string
) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  if (cart.items.length >= CART_ITEM_LIMIT) {
    throw new AppError(400, `Cart cannot have more than ${CART_ITEM_LIMIT} unique items`);
  }

  const reqCurrency = targetCurrency.toUpperCase();

  // Check if item exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId && item.variantSku === variantSku
  );

  const newQuantity = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity + quantity : quantity;

  // Validate total requested quantity
  await validateInventory(productId, variantSku, newQuantity);

  // Set snapshot price dynamically in requested currency
  const priceResult = await priceResolutionService.resolveProductPrice(
    productId,
    variantSku,
    reqCurrency,
    countryCode
  );
  
  const resolvedPrice = priceResult.finalPrice;

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].unitPrice = resolvedPrice;
  } else {
    cart.items.push({
      product: productId as any,
      variantSku,
      quantity,
      unitPrice: resolvedPrice,
    });
  }

  await cart.save();
  return await getCart(userId, reqCurrency, countryCode);
};

export const updateCartItem = async (
  userId: string,
  variantSku: string,
  quantity: number,
  targetCurrency: string = 'USD',
  countryCode?: string
) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError(404, 'Cart not found');

  const itemIndex = cart.items.findIndex(item => item.variantSku === variantSku);
  if (itemIndex === -1) throw new AppError(404, 'Item not found in cart');

  const productId = cart.items[itemIndex].product.toString();
  await validateInventory(productId, variantSku, quantity);

  cart.items[itemIndex].quantity = quantity;
  await cart.save();
  
  return await getCart(userId, targetCurrency, countryCode);
};

export const removeCartItem = async (userId: string, variantSku: string, targetCurrency: string = 'USD', countryCode?: string) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError(404, 'Cart not found');

  cart.items = cart.items.filter(item => item.variantSku !== variantSku) as any;
  await cart.save();

  return await getCart(userId, targetCurrency, countryCode);
};

export const clearCart = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  return [];
};

// Merges guest cart items into authenticated user cart
export const syncCart = async (
  userId: string,
  guestItems: { productId: string; variantSku: string; quantity: number }[],
  targetCurrency: string = 'USD',
  countryCode?: string
) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const reqCurrency = targetCurrency.toUpperCase();

  for (const guestItem of guestItems) {
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === guestItem.productId && item.variantSku === guestItem.variantSku
    );

    const newQuantity = existingItemIndex > -1 
      ? cart.items[existingItemIndex].quantity + guestItem.quantity 
      : guestItem.quantity;

    try {
      await validateInventory(guestItem.productId, guestItem.variantSku, newQuantity);
      
      const priceResult = await priceResolutionService.resolveProductPrice(
        guestItem.productId,
        guestItem.variantSku,
        reqCurrency,
        countryCode
      );

      const resolvedPrice = priceResult.finalPrice;

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].unitPrice = resolvedPrice;
      } else {
        if (cart.items.length < CART_ITEM_LIMIT) {
          cart.items.push({
            product: guestItem.productId as any,
            variantSku: guestItem.variantSku,
            quantity: newQuantity,
            unitPrice: resolvedPrice,
          });
        }
      }
    } catch (err) {
      console.warn(`Could not sync guest cart item ${guestItem.variantSku}:`, err);
    }
  }

  await cart.save();
  return await getCart(userId, reqCurrency, countryCode);
};
