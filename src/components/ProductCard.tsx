import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types/index.js';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800';
  const secondaryImage = product.images?.[1]?.url;

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative w-full aspect-[4/5] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
        <img
          src={primaryImage}
          alt={product.name}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ${secondaryImage ? 'group-hover:opacity-0' : ''}`}
          loading="lazy"
        />
        {secondaryImage && (
          <img
            src={secondaryImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            loading="lazy"
          />
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            Sale
          </div>
        )}
        {product.isFeatured && !hasDiscount && (
          <div className="absolute top-2 left-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold px-2 py-1 rounded">
            Featured
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{product.shortDescription || product.brand}</p>
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">${product.compareAtPrice?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </Link>
  );
};
