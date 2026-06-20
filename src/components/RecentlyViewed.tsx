import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecentlyViewed } from '../services/recentlyViewedService.js';
import { ProductGrid } from './ProductGrid.js';
import { useAuth } from '../providers/AuthProvider.js';

export const RecentlyViewed: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const { data: rv, isLoading } = useQuery({
    queryKey: ['recently-viewed'],
    queryFn: getRecentlyViewed,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isLoading || !rv || rv.items.length === 0) {
    return null;
  }

  const products = rv.items.map((item: any) => item.product).filter((p: any) => typeof p !== 'string');

  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-24">
      <h2 id="recently-viewed-heading" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 border-t border-gray-200 dark:border-gray-800 pt-16 transition-colors">
        Recently viewed
      </h2>
      <ProductGrid products={products} />
    </section>
  );
};
