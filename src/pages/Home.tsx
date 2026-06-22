import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO.js';
import { ProductGrid } from '../components/ProductGrid.js';
import { getFeaturedProducts, getNewArrivals, getBestSellers } from '../services/productService.js';
import { getCategories } from '../services/categoryService.js';

export const Home: React.FC = () => {
  const { data: featuredRaw = [], isLoading: loadingFeatured } = useQuery({ queryKey: ['products', 'featured'], queryFn: getFeaturedProducts });
  const { data: stringNewArrivalsRaw = [], isLoading: loadingNew } = useQuery({ queryKey: ['products', 'newArrivals'], queryFn: getNewArrivals });
  const { data: bestSellersRaw = [], isLoading: loadingBest } = useQuery({ queryKey: ['products', 'bestSellers'], queryFn: getBestSellers });
  const { data: categoriesRaw = [], isLoading: loadingCategories } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const featured = Array.isArray(featuredRaw) ? featuredRaw : [];
  const stringNewArrivals = Array.isArray(stringNewArrivalsRaw) ? stringNewArrivalsRaw : [];
  const bestSellers = Array.isArray(bestSellersRaw) ? bestSellersRaw : [];
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  return (
    <div className="bg-white dark:bg-gray-950 transition-colors">
      <SEO />
      
      {/* Hero Section */}
      <div className="relative bg-gray-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80"
            alt="Hero background"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-serif">
            Elevate Your Everyday
          </h1>
          <p className="mt-6 max-w-lg text-xl text-gray-300">
            Discover our curated collection of premium essentials designed for modern living.
          </p>
          <div className="mt-10">
            <Link
              to="/products"
              className="inline-block bg-white border border-transparent py-3 px-8 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md transition"
            >
              Shop Collection
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Categories */}
        <section aria-labelledby="collections-heading" className="mb-24 relative">
          <div className="flex items-center justify-between mb-8">
            <h2 id="collections-heading" className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Shop by Category
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const container = document.getElementById('categories-scroll-container');
                  if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
                }}
                className="p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById('categories-scroll-container');
                  if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
                }}
                className="p-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
          {loadingCategories ? (
            <div className="flex overflow-x-hidden gap-6 pb-4">
              {[1,2,3,4].map(i => <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 w-[300px] sm:w-[350px] flex-shrink-0 aspect-[3/2] rounded-lg" />)}
            </div>
          ) : (
            <div id="categories-scroll-container" className="flex overflow-x-auto gap-6 pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`#categories-scroll-container::-webkit-scrollbar { display: none; }`}</style>
              {categories.map((category) => (
                <Link key={category.id} to={`/categories/${category.slug}`} className="group relative rounded-lg overflow-hidden flex-shrink-0 w-[280px] sm:w-[320px] aspect-[3/2]">
                  <img
                    src={category.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80'}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-2xl font-bold text-white tracking-wide">{category.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured Products */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Featured</h2>
            <Link to="/products?sort=featured" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
              View all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <ProductGrid products={featured.slice(0, 4)} isLoading={loadingFeatured} skeletonCount={4} />
        </section>

        {/* New Arrivals */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">New Arrivals</h2>
            <Link to="/products?sort=newest" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
              View all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <ProductGrid products={stringNewArrivals.slice(0, 4)} isLoading={loadingNew} skeletonCount={4} />
        </section>

        {/* Best Sellers */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Best Sellers</h2>
            <Link to="/products?sort=best-sellers" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
              View all <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
          <ProductGrid products={bestSellers.slice(0, 4)} isLoading={loadingBest} skeletonCount={4} />
        </section>
      </div>
    </div>
  );
};
