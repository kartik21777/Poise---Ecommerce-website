import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { Pagination } from '../components/Pagination.js';
import { getProducts } from '../services/productService.js';
import { ErrorState } from '../components/FeedbackStates.js';
import { Filter } from 'lucide-react';

export const ProductList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Parse URL params
  const page = Number(searchParams.get('page')) || 1;
  const sort = searchParams.get('sort') || 'newest';
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { page, sort, q, category }],
    queryFn: () => getProducts({ page, limit: 12, sort, q, category }),
    placeholderData: keepPreviousData,
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams(prev => {
      prev.set('page', newPage.toString());
      return prev;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams(prev => {
      prev.set('sort', e.target.value);
      prev.set('page', '1');
      return prev;
    });
  };

  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="bg-white">
      <SEO title={q ? `Search results for "${q}"` : 'All Products'} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-baseline justify-between border-b border-gray-200 pb-6 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-serif">
            {q ? `Search: ${q}` : 'All Products'}
          </h1>

          <div className="flex items-center space-x-4">
            <select
              value={sort}
              onChange={handleSortChange}
              className="pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm rounded-md"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Price: Low to High</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="featured">Featured</option>
            </select>
            <button
              type="button"
              className="p-2 -m-2 ml-4 sm:ml-6 text-gray-400 hover:text-gray-500 lg:hidden"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <section aria-labelledby="products-heading" className="pt-6 pb-24">
          <h2 id="products-heading" className="sr-only">Products</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10">
            {/* Desktop Filters */}
            <div className={`hidden lg:block ${isFilterOpen ? 'block' : 'hidden lg:block'}`}>
              <form className="space-y-10 divide-y divide-gray-200">
                {/* Placeholder for real category/brand filters */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-900">Categories</legend>
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center">
                        <input id="cat-all" type="radio" name="category" className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900" 
                          checked={!category}
                          onChange={() => {
                            setSearchParams(prev => { prev.delete('category'); prev.set('page', '1'); return prev; });
                          }}
                        />
                        <label htmlFor="cat-all" className="ml-3 text-sm text-gray-600">All Categories</label>
                      </div>
                      <div className="flex items-center">
                        <input id="cat-placeholder" type="radio" name="category" className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900" 
                          checked={category === 'placeholder'}
                          onChange={() => {
                            // Phase 5: Fetch categories and render
                          }}
                        />
                        <label htmlFor="cat-placeholder" className="ml-3 text-sm text-gray-600">Apparel (coming soon)</label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </form>
            </div>

            {/* Product grid */}
            <div className="lg:col-span-3">
              <ProductGrid products={data?.data || []} isLoading={isLoading} skeletonCount={12} />
              
              {!isLoading && data && data.totalPages > 1 && (
                <Pagination 
                  currentPage={data.currentPage} 
                  totalPages={data.totalPages} 
                  onPageChange={handlePageChange} 
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
