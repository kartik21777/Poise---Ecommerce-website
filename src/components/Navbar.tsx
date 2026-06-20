import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../providers/AuthProvider.js';
import { useCart } from '../hooks/useCart.js';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart, guestCartItems } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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
              <div 
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button 
                  className="p-2 text-gray-400 hover:text-gray-500"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <User className="h-6 w-6" />
                </button>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="absolute right-0 w-48 py-2 mt-1 bg-white rounded-md shadow-xl border border-gray-100 origin-top-right z-50 focus:outline-none"
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account</Link>
                      <Link onClick={() => setIsUserMenuOpen(false)} to="/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium text-indigo-600">My Wallet</Link>
                      <button onClick={() => { setIsUserMenuOpen(false); logout(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
              className="p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 relative z-[70] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu wrapper */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/60 z-[60]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }} // smooth ease-out
              className="fixed top-0 right-0 w-[85%] max-w-sm h-full bg-white z-[65] shadow-2xl flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <span className="text-xl font-bold font-serif text-gray-900">POISE</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="px-4 pt-6 pb-6 space-y-6 flex-1">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </form>
                
                <div className="space-y-1 mt-6">
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/products" className="block py-3 text-lg font-medium text-gray-900 border-b border-gray-100">Shop All</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/categories/new" className="block py-3 text-lg font-medium text-gray-900 border-b border-gray-100">New Arrivals</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/categories/sale" className="block py-3 text-lg font-medium text-gray-900 border-b border-gray-100">Sale</Link>
                </div>
              </div>

              <div className="px-4 py-8 border-t border-gray-200 bg-gray-50">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <div className="pt-4 space-y-2">
                      <Link onClick={() => setIsMobileMenuOpen(false)} to="/account" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">Account Settings</Link>
                      <Link onClick={() => setIsMobileMenuOpen(false)} to="/wallet" className="block px-3 py-2 rounded-md text-base font-medium text-indigo-700 hover:bg-indigo-100">My Wallet</Link>
                      <button onClick={() => { setIsMobileMenuOpen(false); logout(); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-200">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Link onClick={() => setIsMobileMenuOpen(false)} to="/login" className="block w-full text-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-800">
                      Sign in
                    </Link>
                    <p className="mt-4 text-center text-sm text-gray-500">
                      New to Poise? <Link onClick={() => setIsMobileMenuOpen(false)} to="/register" className="font-medium text-gray-900 hover:underline">Create an account</Link>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
};
