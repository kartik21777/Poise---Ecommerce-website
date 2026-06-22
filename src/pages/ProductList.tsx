import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { Pagination } from '../components/Pagination.js';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';
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

  const { data: categoriesRaw = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categoriesList = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const selectedCategory = categoriesList.find(c => c.slug === category);
  const categoryIdParam = selectedCategory ? selectedCategory.id : (category ? 'invalid-id' : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', { page, sort, q, category: categoryIdParam }],
    queryFn: () => getProducts({ page, limit: 12, sort, q, category: categoryIdParam }),
    placeholderData: keepPreviousData,
    enabled: category ? !!selectedCategory : true,
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
    <div className="bg-white dark:bg-gray-950 transition-colors">
      <SEO title={q ? `Search results for "${q}"` : 'All Products'} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-baseline justify-between border-b border-gray-200 dark:border-gray-800 pb-6 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white font-serif">
            {q ? `Search: ${q}` : 'All Products'}
          </h1>

          <div className="flex items-center space-x-4">
            <select
              value={sort}
              onChange={handleSortChange}
              className="pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm rounded-md transition-colors"
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
              <form className="space-y-10 divide-y divide-gray-200 dark:divide-gray-800">
                {/* Placeholder for real category/brand filters */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-900 dark:text-white">Categories</legend>
                    <div className="pt-4 space-y-3">
                      <div className="flex items-center">
                        <input id="cat-all" type="radio" name="category" className="h-4 w-4 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-white transition-colors" 
                          checked={!category}
                          onChange={() => {
                            setSearchParams(prev => { prev.delete('category'); prev.set('page', '1'); return prev; });
                          }}
                        />
                        <label htmlFor="cat-all" className="ml-3 text-sm text-gray-600 dark:text-gray-400">All Categories</label>
                      </div>
                      {categoriesList.map((cat) => (
                        <div key={cat.id} className="flex items-center">
                          <input id={`cat-${cat.slug}`} type="radio" name="category" className="h-4 w-4 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-gray-900 dark:focus:ring-white transition-colors" 
                            checked={category === cat.slug}
                            onChange={() => {
                              setSearchParams(prev => { prev.set('category', cat.slug); prev.set('page', '1'); return prev; });
                            }}
                          />
                          <label htmlFor={`cat-${cat.slug}`} className="ml-3 text-sm text-gray-600 dark:text-gray-400">{cat.name}</label>
                        </div>
                      ))}
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
