import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Section */}
          <div className="md:col-span-5 lg:col-span-4 pr-0 lg:pr-12">
            <Link to="/" className="text-2xl font-bold font-serif text-gray-900 tracking-tight block mb-4">
              POISE
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              Premium essentials for modern living. We believe in intentional design, exceptional quality, and enduring style.
            </p>
            
            <div className="mb-8">
              <h4 className="text-xs font-semibold text-gray-900 tracking-wider uppercase mb-3">Subscribe</h4>
              <form className="flex max-w-sm">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="w-full min-w-0 appearance-none bg-white border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
                  aria-label="Email address"
                />
                <button 
                  type="button" 
                  className="flex-shrink-0 bg-gray-900 border border-transparent px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Join
                </button>
              </form>
            </div>

            <div className="flex space-x-5">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors" aria-label="Facebook">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="md:col-span-7 lg:col-span-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xs font-semibold text-gray-900 tracking-widest uppercase mb-5">Shop</h3>
                <ul className="space-y-4">
                  <li><Link to="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">All Products</Link></li>
                  <li><Link to="/categories/new" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">New Arrivals</Link></li>
                  <li><Link to="/categories/sale" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Featured</Link></li>
                  <li><Link to="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Collections</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xs font-semibold text-gray-900 tracking-widest uppercase mb-5">Support</h3>
                <ul className="space-y-4">
                  <li><Link to="/faq" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">FAQ</Link></li>
                  <li><Link to="/shipping" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Shipping & Returns</Link></li>
                  <li><Link to="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact Us</Link></li>
                </ul>
              </div>

              <div className="col-span-2 lg:col-span-1 mt-4 lg:mt-0">
                <h3 className="text-xs font-semibold text-gray-900 tracking-widest uppercase mb-5">Company</h3>
                <ul className="space-y-4">
                  <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">About Us</Link></li>
                  <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sustainability</Link></li>
                  <li><Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Careers</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} POISE. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            <Link to="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Terms & Conditions</Link>
            <Link to="#" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
