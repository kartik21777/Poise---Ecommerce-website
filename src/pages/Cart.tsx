import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../hooks/useCart.js';
import { SEO } from '../components/SEO.js';
import { formatPrice } from '../utils/currency.js';
import { Product } from '../types/index.js';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { cart, guestCartItems, updateItem, removeItem, isLoading } = useCart();

  const items = cart ? cart.items : guestCartItems;
  const totalPrice = cart ? cart.totalPrice : 0; // Guest cart could calculate total if we stored prices, but for now we might map out a basic layout.

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading cart...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <SEO title="Your Cart" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="inline-block bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-md font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      <SEO title="Your Cart" />
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-8">Shopping Cart</h1>
      
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
        <div className="lg:col-span-7">
          <ul role="list" className="border-t border-b border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
            {items.map((item: any, idx: number) => {
              const product = typeof item.product === 'string' ? { name: 'Unknown Product', price: item.unitPrice } : item.product || {};
              const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/150';
              
              return (
                <li key={`${item.variantSku}-${idx}`} className="flex py-6 sm:py-10">
                  <div className="flex-shrink-0">
                    <img src={imageUrl} alt={product.name} className="w-24 h-24 rounded-md object-center object-cover sm:w-32 sm:h-32" />
                  </div>
                  <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <Link to={`/products/${product.slug || ''}`} className="font-medium text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white">
                              {product.name || 'Product'}
                            </Link>
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">SKU: {item.variantSku}</p>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{formatPrice(item.unitPrice || 0)}</p>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md w-max">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeItem(item.variantSku);
                              } else {
                                updateItem({ variantSku: item.variantSku, quantity: item.quantity - 1 });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-2 text-gray-900 dark:text-white text-sm font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateItem({ variantSku: item.variantSku, quantity: Math.min(99, item.quantity + 1) })}
                            className="p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="absolute top-0 right-0">
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantSku)}
                            className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                          >
                            <span className="sr-only">Remove</span>
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="mt-16 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 transition-colors">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Order summary</h2>
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
              <dt className="text-base font-medium text-gray-900 dark:text-white">Order total</dt>
              <dd className="text-base font-medium text-gray-900 dark:text-white">{formatPrice(totalPrice || 0)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-gray-900 dark:bg-white border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
