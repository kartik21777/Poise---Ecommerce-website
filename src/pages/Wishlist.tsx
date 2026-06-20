import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingCart } from 'lucide-react';
import { useWishlist } from '../hooks/useWishlist.js';
import { useCart } from '../hooks/useCart.js';
import { SEO } from '../components/SEO.js';

export const WishlistPage: React.FC = () => {
  const { wishlist, isLoading: wishlistLoading, toggleItem } = useWishlist();
  const { addItem } = useCart();

  const handleMoveToCart = async (product: any) => {
    // We assume variant 0 exists for simplicity, but normally the user would choose a variant on the product page.
    const sku = product.variants?.[0]?.sku || product._id;
    await addItem({ productId: product.id, variantSku: sku, quantity: 1 });
    await toggleItem({ productId: product.id, isAdding: false });
  };

  if (wishlistLoading) {
    return <div className="p-12 text-center text-gray-500">Loading wishlist...</div>;
  }

  const items = wishlist?.products || [];

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <SEO title="Your Wishlist" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-8">Save items you like to your wishlist to find them easily later.</p>
        <Link to="/products" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Your Wishlist" />
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">Your Wishlist</h1>
      
      <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {items.map((product: any) => {
          if (typeof product === 'string') return null;
          const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/300';
          return (
            <div key={product.id} className="group relative">
              <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                <img src={imageUrl} alt={product.name} className="w-full h-full object-center object-cover group-hover:opacity-75" />
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <Link to={`/products/${product.slug}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.brand}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${product.price}</p>
              </div>
              
              <div className="mt-4 flex space-x-2 z-10 relative">
                <button
                  onClick={() => handleMoveToCart(product)}
                  className="flex-1 bg-gray-900 text-white px-3 py-2 text-sm rounded hover:bg-gray-800 flex justify-center items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                </button>
                <button
                  onClick={() => toggleItem({ productId: product.id, isAdding: false })}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
