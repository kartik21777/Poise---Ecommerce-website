import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../providers/AuthProvider.js';
import { useCart } from '../hooks/useCart.js';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { cart, guestCartItems } = useCart();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
        setShowWishlistPrompt(false);
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

  const handleWishlistClick = () => {
    if (isAuthenticated) {
      navigate('/wishlist');
      return;
    }

    setIsMobileMenuOpen(false);
    setShowWishlistPrompt(true);
  };

  const handleWishlistSignIn = () => {
    setShowWishlistPrompt(false);
    navigate('/login', { state: { from: { pathname: '/wishlist' } } });
  };

  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex px-2 lg:px-0 flex-1 justify-between lg:justify-start">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold font-serif tracking-tight text-gray-900 dark:text-white">
                POISE
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-10 lg:flex lg:space-x-8 lg:items-center">
              <Link to="/products" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Shop</Link>
              <Link to="/categories/new" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">New</Link>
              <Link to="/categories/sale" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Sale</Link>
            </div>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white transition-colors"
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
                        <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      {user && ['admin', 'super_admin'].includes(user.role) && (
                        <Link onClick={() => setIsUserMenuOpen(false)} to="/admin" className="block px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-gray-50">
                          Admin Dashboard
                        </Link>
                      )}
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

            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label="View wishlist"
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors"
            >
              <Heart className="h-6 w-6" />
            </button>

            <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors">
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs flex items-center justify-center transition-colors">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden space-x-4">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleWishlistClick}
              aria-label="View wishlist"
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors"
            >
              <Heart className="h-6 w-6" />
            </button>
            <Link to="/cart" className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors">
              <ShoppingBag className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs flex items-center justify-center transition-colors">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
              className="p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 relative z-[70] lg:hidden transition-colors"
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
              className="fixed top-0 right-0 w-[85%] max-w-sm h-full bg-white dark:bg-gray-950 z-[65] shadow-2xl flex flex-col overflow-y-auto"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xl font-bold font-serif text-gray-900 dark:text-white">POISE</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-white"
                    />
                    <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </form>
                
                <div className="space-y-1 mt-6">
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/products" className="block py-3 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Shop All</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/categories/new" className="block py-3 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">New Arrivals</Link>
                  <Link onClick={() => setIsMobileMenuOpen(false)} to="/categories/sale" className="block py-3 text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800">Sale</Link>
                </div>
              </div>

              <div className="px-4 py-8 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                      <div className="ml-4">
                        <div className="text-base font-medium text-gray-900">{user?.name}</div>
                        <div className="text-sm text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <div className="pt-4 space-y-2">
                      {user && ['admin', 'super_admin'].includes(user.role) && (
                        <Link onClick={() => setIsMobileMenuOpen(false)} to="/admin" className="block px-3 py-2 rounded-md text-base font-semibold text-indigo-600 hover:bg-indigo-100">
                          Admin Dashboard
                        </Link>
                      )}
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

      <AnimatePresence>
        {showWishlistPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
            onClick={() => setShowWishlistPrompt(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wishlist-sign-in-title"
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                  <Heart className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <h2 id="wishlist-sign-in-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Please sign in to view your wishlist
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Would you like to go to the sign-in page now?
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWishlistPrompt(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Not now
                </button>
                <button
                  type="button"
                  onClick={handleWishlistSignIn}
                  autoFocus
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                >
                  Sign in
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
