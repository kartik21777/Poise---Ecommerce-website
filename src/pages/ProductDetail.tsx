import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { SEO } from '../components/SEO.js';
import { getProductBySlug, getRelatedProducts } from '../services/productService.js';
import { ErrorState, LoadingSkeleton } from '../components/FeedbackStates.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { RecentlyViewed } from '../components/RecentlyViewed.js';
import { useCart } from '../hooks/useCart.js';
import { useWishlist } from '../hooks/useWishlist.js';
import { addRecentlyViewed } from '../services/recentlyViewedService.js';
import { useAuth } from '../providers/AuthProvider.js';
import { useToast } from '../components/Toast.js';

export const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: related = [] } = useQuery({
    queryKey: ['product', slug, 'related'],
    queryFn: () => getRelatedProducts(slug!),
    enabled: !!slug,
  });

  const { addItem: addToCart } = useCart();
  const { toggleItem: toggleWishlist, isInWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { success, warning, error: toastError } = useToast();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (product?.id && isAuthenticated) {
      addRecentlyViewed(product.id).catch(console.error);
    }
  }, [product?.id, isAuthenticated]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const variantSku = product.variants?.[0]?.sku || product.id;
      await addToCart({ productId: product.id, variantSku, quantity: 1 });
      success('Added to cart!', `${product.name} has been added to your bag.`);
    } catch (err: any) {
      toastError('Could not add to cart', err?.response?.data?.message || 'Please try again.');
    }
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      warning('Login required', 'Please log in to save items to your wishlist.');
      return;
    }
    try {
      await toggleWishlist({ productId: product.id, isAdding: !isInWishlist(product.id) });
    } catch (err: any) {
      toastError('Could not update wishlist', err?.response?.data?.message || 'Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
          <LoadingSkeleton className="aspect-square w-full rounded-lg" />
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <LoadingSkeleton className="h-8 w-3/4 mb-4" />
            <LoadingSkeleton className="h-6 w-1/4 mb-8" />
            <LoadingSkeleton className="h-32 w-full mb-8" />
            <LoadingSkeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return <ErrorState title="Product not found" message="The product you are looking for does not exist." onRetry={refetch} />;
  }

  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800';
  const displayImage = selectedImage || primaryImage;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="bg-white dark:bg-gray-950 transition-colors">
      <SEO 
        title={product.metaTitle || product.name} 
        description={product.metaDescription || product.shortDescription || product.description} 
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          
          {/* Image Gallery */}
          <div className="flex flex-col-reverse">
            <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
              <div className="grid grid-cols-4 gap-6" aria-orientation="horizontal" role="tablist">
                {product.images?.map((image, index) => (
                  <button
                    key={index}
                    className="relative h-24 bg-white dark:bg-gray-900 rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring focus:ring-opacity-50 focus:ring-offset-4 dark:focus:ring-offset-gray-950 transition-colors"
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <span className="absolute inset-0 rounded-md overflow-hidden">
                      <img src={image.url} alt="" className="w-full h-full object-center object-cover" />
                    </span>
                    <span className={`absolute inset-0 rounded-md ring-2 ring-offset-2 pointer-events-none transition-colors ${displayImage === image.url ? 'ring-gray-900 dark:ring-white' : 'ring-transparent'}`} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full aspect-square relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 transition-colors">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-center object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="mt-10 px-4 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">{product.name}</h1>
            
            <div className="mt-3 flex items-center">
              <p className="text-3xl text-gray-900 dark:text-white font-medium">${product.price.toFixed(2)}</p>
              {hasDiscount && (
                <p className="ml-4 text-xl text-gray-500 dark:text-gray-400 line-through">${product.compareAtPrice?.toFixed(2)}</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>
              <div className="text-base text-gray-700 dark:text-gray-300 space-y-6" dangerouslySetInnerHTML={{ __html: product.description }} />
            </div>

            <div className="mt-10 flex space-x-4">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-gray-900 dark:bg-white border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-gray-900 dark:focus:ring-white transition-colors"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                className={`p-3 rounded-md border flex items-center justify-center transition-colors ${
                  product && isInWishlist(product.id)
                    ? 'border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-gray-500 hover:bg-gray-50 dark:hover:text-gray-300 dark:hover:bg-gray-800'
                }`}
                aria-label="Add to wishlist"
              >
                <Heart className={`h-6 w-6 ${product && isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-24">
            <h2 id="related-heading" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 border-t border-gray-200 dark:border-gray-800 pt-16 transition-colors">
              You may also like
            </h2>
            <ProductGrid products={related} />
          </section>
        )}

        {/* Recently Viewed */}
        <RecentlyViewed />
      </div>
    </div>
  );
};
