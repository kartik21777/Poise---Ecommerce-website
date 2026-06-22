import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Crown, ArrowRight, SlidersHorizontal, X, TrendingUp } from 'lucide-react';
import { SEO } from '../components/SEO.js';
import { ProductCard } from '../components/ProductCard.js';
import { LoadingSkeleton } from '../components/FeedbackStates.js';
import { Pagination } from '../components/Pagination.js';
import { getProducts } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Best Match' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
];

const HIGHLIGHTS = [
  { icon: Crown, label: 'Editor\'s Picks', desc: 'Hand-selected by our style team' },
  { icon: Star, label: 'Top Rated', desc: 'Loved by thousands of customers' },
  { icon: TrendingUp, label: 'Trending Now', desc: 'What everyone is wearing' },
];

export const Featured: React.FC = () => {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('featured');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: categoriesRaw = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const categoriesList = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const selectedCatObj = categoriesList.find(c => c.slug === selectedCategory);
  const categoryIdParam = selectedCatObj ? selectedCatObj.id : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured-page', { page, sort, categoryIdParam }],
    queryFn: () => getProducts({ page, limit: 12, sort, category: categoryIdParam }),
    placeholderData: keepPreviousData,
  });

  const products = (data?.data || []).filter((p: any) => sort === 'featured' ? p.isFeatured !== false : true);
  const allProducts = data?.data || [];
  const displayProducts = sort === 'featured' && allProducts.length > 0
    ? allProducts  // server handles isFeatured filtering via sort=featured
    : allProducts;
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <SEO
        title="Featured Collection"
        description="Explore our hand-picked featured collection — premium picks curated by our style team and loved by thousands."
      />

      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 40%, #0d1a3a 70%, #0a0a0a 100%)' }}>
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[300px] rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[80px] pointer-events-none" />

        {/* Star particles (decorative) */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/30 animate-pulse"
            style={{
              top: `${15 + i * 12}%`,
              left: `${5 + i * 15}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${2 + i * 0.3}s`,
            }}
          />
        ))}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-300/80 text-xs font-semibold tracking-widest uppercase mb-6 backdrop-blur"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              Editor's Selection
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-serif tracking-tight text-white leading-none"
            >
              Featured <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-purple-400 bg-clip-text text-transparent">Collection</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-xl text-lg text-gray-400"
            >
              Premium picks, curated with care. Each piece in our featured collection is chosen to inspire your best self.
            </motion.p>

            {/* Highlight badges */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl"
            >
              {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border border-white/5 bg-white/3 backdrop-blur"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-sm font-semibold text-white">{label}</span>
                  <span className="text-xs text-gray-500 text-center">{desc}</span>
                </div>
              ))}
            </motion.div>
          </div>
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
              {isLoading ? 'Loading...' : `${data?.totalItems ?? 0} curated products`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {selectedCategory && (
                <span className="ml-1 h-2 w-2 rounded-full bg-amber-500 inline-block" />
              )}
            </button>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors appearance-none"
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium border border-amber-200 dark:border-amber-700">
              {categoriesList.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              <button
                onClick={() => { setSelectedCategory(''); setPage(1); }}
                className="ml-0.5 hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
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
        ) : displayProducts.length === 0 ? (
          <div className="py-24 text-center">
            <Crown className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No featured items yet</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Our team is curating the best picks. Come back soon.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 xl:gap-x-8"
          >
            {displayProducts.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                {/* Featured badge overlay wrapper */}
                <div className="relative">
                  {product.isFeatured && (
                    <div className="absolute top-2 right-2 z-10 pointer-events-none">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold tracking-wide uppercase">
                        <Star className="w-2.5 h-2.5 fill-white" />
                        Featured
                      </span>
                    </div>
                  )}
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

        {/* Bottom CTA — Split banner */}
        <div className="mt-20 grid sm:grid-cols-2 gap-6">
          <div className="rounded-2xl overflow-hidden relative p-8 sm:p-10 flex flex-col justify-end min-h-[220px]" style={{ background: 'linear-gradient(135deg, #1e0533 0%, #3b0764 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-[60px] pointer-events-none" />
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest mb-2">New This Week</span>
            <h3 className="text-xl font-extrabold font-serif text-white">See what just landed</h3>
            <Link
              to="/new-arrivals"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-purple-200 hover:text-white transition-colors group"
            >
              Shop New Arrivals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="rounded-2xl overflow-hidden relative p-8 sm:p-10 flex flex-col justify-end min-h-[220px]" style={{ background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 100%)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-[60px] pointer-events-none" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Full Catalog</span>
            <h3 className="text-xl font-extrabold font-serif text-white">Explore everything</h3>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-white transition-colors group"
            >
              Browse All Products <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
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
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
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
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
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
                  className="w-full mt-2 py-2.5 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
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
