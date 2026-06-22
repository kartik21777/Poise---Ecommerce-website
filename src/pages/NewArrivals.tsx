import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { SEO } from '../components/SEO.js';
import { ProductCard } from '../components/ProductCard.js';
import { LoadingSkeleton } from '../components/FeedbackStates.js';
import { Pagination } from '../components/Pagination.js';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export const NewArrivals: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: categoriesRaw = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categoriesList = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const selectedCatObj = categoriesList.find(c => c.slug === selectedCategory);
  const categoryIdParam = selectedCatObj ? selectedCatObj.id : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'new-arrivals-page', { page, sort, categoryIdParam }],
    queryFn: () => getProducts({ page, limit: 12, sort, category: categoryIdParam }),
    placeholderData: keepPreviousData,
  });

  const products = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <SEO
        title="New Arrivals"
        description="Discover the latest additions to our curated collection — fresh styles, new essentials, and trending pieces just landed."
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gray-950">
        {/* Animated gradient orbs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-20 right-0 w-[400px] h-[400px] rounded-full bg-violet-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-sky-600/10 blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 text-xs font-semibold tracking-widest uppercase mb-6 backdrop-blur"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Just Dropped
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-serif tracking-tight text-white leading-none"
          >
            New <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">Arrivals</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-xl text-lg text-gray-400"
          >
            Fresh drops, curated weekly. Be the first to explore the latest additions to our ever-evolving collection.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            {['This Week', 'Last Week', 'This Month'].map((label) => (
              <span
                key={label}
                className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/5 border border-white/10 text-white/60 backdrop-blur cursor-default select-none"
              >
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-950 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? 'Loading...' : `${data?.totalItems ?? 0} products`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {selectedCategory && (
                <span className="ml-1 h-2 w-2 rounded-full bg-indigo-500 inline-block" />
              )}
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter chip */}
        {selectedCategory && (
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium border border-indigo-200 dark:border-indigo-700">
              {categoriesList.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
                aria-label="Remove category filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 xl:gap-x-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="group block">
                <LoadingSkeleton className="w-full aspect-[4/5] mb-4 rounded-xl" />
                <LoadingSkeleton className="h-4 w-3/4 mb-2" />
                <LoadingSkeleton className="h-4 w-1/2 mb-2" />
                <LoadingSkeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center">
            <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Nothing here yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Check back soon — new drops are on the way.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 xl:gap-x-8"
          >
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                {/* "New" badge overlay wrapper */}
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10 pointer-events-none">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold tracking-wide uppercase">New</span>
                  </div>
                  <ProductCard product={product} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
        )}

        {/* Bottom CTA */}
        <div className="mt-20 rounded-2xl bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 p-10 sm:p-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-indigo-600/20 blur-[80px] pointer-events-none" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white">Never miss a drop</h2>
            <p className="mt-2 text-gray-400 text-sm sm:text-base">Browse our full catalog and discover everything in stock.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-900 font-semibold text-sm hover:bg-gray-100 transition-colors shrink-0 group"
          >
            Shop All Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Filters</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Category</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setSelectedCategory(''); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        !selectedCategory
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      All Categories
                    </button>
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.slug); setPage(1); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.slug
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setPage(1);
                    setIsFilterOpen(false);
                  }}
                  className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full mt-2 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
