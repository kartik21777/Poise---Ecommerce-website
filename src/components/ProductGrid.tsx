import React from 'react';
import { Product } from '../types/index.js';
import { ProductCard } from './ProductCard.js';
import { LoadingSkeleton } from './FeedbackStates.js';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, skeletonCount = 8 }) => {
  const safeProducts = Array.isArray(products) ? products : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 xl:gap-x-8">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className="group block">
            <LoadingSkeleton className="w-full aspect-[4/5] mb-4 rounded-lg" />
            <LoadingSkeleton className="h-4 w-3/4 mb-2" />
            <LoadingSkeleton className="h-4 w-1/2 mb-2" />
            <LoadingSkeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (safeProducts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 xl:gap-x-8">
      {safeProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
