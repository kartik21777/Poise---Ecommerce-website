import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '../components/SEO.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { getProducts } from '../services/productService.js';
import { getCategoryBySlug } from '../services/categoryService.js';
import { ErrorState, LoadingSkeleton } from '../components/FeedbackStates.js';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: category, isLoading: loadingCat, isError: errorCat } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  const { data: productsData, isLoading: loadingProd } = useQuery({
    queryKey: ['products', { category: category?.id }],
    queryFn: () => getProducts({ category: category?.id, limit: 24 }),
    enabled: !!category?.id,
  });

  if (loadingCat) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <LoadingSkeleton className="h-12 w-1/3 mb-10" />
        <ProductGrid products={[]} isLoading={true} skeletonCount={8} />
      </div>
    );
  }

  if (errorCat || !category) {
    return <ErrorState title="Category not found" message="This category does not exist." />;
  }

  return (
    <div className="bg-white dark:bg-gray-950 transition-colors">
      <SEO title={`${category.name} | Poise`} description={category.description} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="border-b border-gray-200 dark:border-gray-800 pb-8 mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-2xl text-lg text-gray-500 dark:text-gray-400">{category.description}</p>
          )}
        </div>

        <ProductGrid products={productsData?.data || []} isLoading={loadingProd} skeletonCount={8} />
      </div>
    </div>
  );
};
