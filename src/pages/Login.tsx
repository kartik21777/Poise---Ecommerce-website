import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider.js';
import * as authService from '../services/authService.js';
import * as cartService from '../services/cartService.js';
import * as guestCartService from '../services/guestCartService.js';
import { SEO } from '../components/SEO.js';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.login({ email, password });

      // Establish the authenticated UI state before making protected follow-up requests.
      login(res.user);

      const guestItems = guestCartService.getGuestCart();
      if (guestItems.length > 0) {
        try {
          await cartService.syncCart(guestItems);
          guestCartService.clearGuestCart();
          window.dispatchEvent(new Event('local-storage'));
          await queryClient.invalidateQueries({ queryKey: ['cart'] });
        } catch (syncError) {
          // Preserve the guest cart for a later retry without treating login as failed.
          console.error('Could not merge guest cart after login:', syncError);
        }
      }

      const adminRoles = ['admin', 'super_admin'];
      if (adminRoles.includes(res.user.role)) {
        navigate('/admin');
      } else if (res.user.role === 'vendor') {
        navigate('/vendor');
      } else {
        const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } })?.from;
        navigate(from ? `${from.pathname || '/'}${from.search || ''}${from.hash || ''}` : '/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO title="Log In" />
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Log in to your account</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
          Sign up
        </Link>
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-gray-900 dark:bg-gray-900 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-white border-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Remember me</label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">Forgot password?</Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
