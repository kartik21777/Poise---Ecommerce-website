import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider.js';
import * as authService from '../services/authService.js';
import * as cartService from '../services/cartService.js';
import * as guestCartService from '../services/guestCartService.js';
import { SEO } from '../components/SEO.js';

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password
      };
      const res = await authService.register(payload);
      
      // Automatically login the user after successful registration
      const loginRes = await authService.login({
        email: payload.email,
        password: payload.password
      });

      const guestItems = guestCartService.getGuestCart();
      if (guestItems.length > 0) {
        await cartService.syncCart(guestItems);
        guestCartService.clearGuestCart();
        window.dispatchEvent(new Event('local-storage'));
        await queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
      
      login(loginRes.user);
      navigate('/');
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.errors && data.errors.length > 0) {
        setError(data.errors[0].message);
      } else {
        setError(data?.message || 'Failed to register.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <>
      <SEO title="Sign Up" />
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Create your account</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
          Log in
        </Link>
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
              <div className="mt-1">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
              <div className="mt-1">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-gray-900 dark:focus:ring-white focus:border-gray-900 dark:focus:border-white sm:text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
