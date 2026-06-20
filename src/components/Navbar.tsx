import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider.js';
import { useCart } from '../hooks/useCart.js';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart, guestCartItems } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartItemCount = useMemo(() => {
    if (isAuthenticated && cart) {
      return cart.totalItems;
    }
    return guestCartItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
  }, [isAuthenticated, cart, guestCartItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex px-2 lg:px-0 flex-1 justify-between lg:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold font-serif tracking-tight text-gray-900">
                POISE
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8 lg:items-center">
              <Link to="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">Shop</Link>
              <Link to="/categories/new" className="text-sm font-medium text-gray-700 hover:text-gray-900">New</Link>
              <Link to="/categories/sale" className="text-sm font-medium text-gray-700 hover:text-gray-900">Sale</Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
              <Search className="h-4 w-4 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </form>

            {isAuthenticated ? (
              <div className="group relative">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <User className="h-6 w-6" />
                </button>
                <div className="hidden group-hover:block absolute right-0 w-48 py-2 mt-1 bg-white rounded-md shadow-xl border border-gray-100">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account</Link>
                  <Link to="/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium text-indigo-600">My Wallet</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                Log in
              </Link>
            )}

            <Link to="/wishlist" className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Heart className="h-6 w-6" />
            </Link>

            <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500 relative">
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden space-x-4">
            <Link to="/wishlist" className="p-2 text-gray-400 hover:text-gray-500 relative">
              <Heart className="h-6 w-6" />
            </Link>
            <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500 relative">
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <form onSubmit={handleSearch} className="p-2">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </form>
            <Link to="/products" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Shop</Link>
            <Link to="/categories/new" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">New</Link>
            <Link to="/categories/sale" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Sale</Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <div className="px-5 space-y-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.firstName} {user?.lastName}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <Link to="/account" className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Account</Link>
                <Link to="/wallet" className="block px-3 py-2 rounded-md text-base font-medium text-indigo-650 hover:bg-gray-50">My Wallet</Link>
                <button onClick={logout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">Logout</button>
              </div>
            ) : (
              <div className="px-5">
                <Link to="/login" className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800">
                  Log in
                </Link>
                <p className="mt-4 text-center text-sm font-medium text-gray-500">
                  Don't have an account? <Link to="/register" className="text-gray-900 hover:text-gray-700">Sign up</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
