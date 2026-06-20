import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="text-2xl font-bold font-serif text-gray-900 tracking-tight">
              POISE
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Premium essentials for modern living.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Shop</h3>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-base text-gray-500 hover:text-gray-900">All Products</Link></li>
              <li><Link to="/products?sort=newest" className="text-base text-gray-500 hover:text-gray-900">New Arrivals</Link></li>
              <li><Link to="/products?sort=featured" className="text-base text-gray-500 hover:text-gray-900">Featured</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link to="/faq" className="text-base text-gray-500 hover:text-gray-900">FAQ</Link></li>
              <li><Link to="/shipping" className="text-base text-gray-500 hover:text-gray-900">Shipping</Link></li>
              <li><Link to="/returns" className="text-base text-gray-500 hover:text-gray-900">Returns</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-base text-gray-500 hover:text-gray-900">About Us</Link></li>
              <li><Link to="/contact" className="text-base text-gray-500 hover:text-gray-900">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {new Date().getFullYear()} Poise, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
