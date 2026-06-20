import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as authService from '../services/authService.js';
import { SEO } from '../components/SEO.js';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    try {
      const res = await authService.forgotPassword(email);
      setStatus('success');
      setMessage(res.message);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to send reset email.');
    }
  };

  if (status === 'success') {
    return (
      <>
        <SEO title="Check Your Email" />
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Check your email</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-6">
          <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">Return to log in</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Forgot Password" />
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Reset your password</h2>
      <p className="mt-2 text-sm text-gray-500">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
            >
              {status === 'loading' ? 'Sending...' : 'Send reset instructions'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">Return to log in</Link>
          </div>
        </form>
      </div>
    </>
  );
};
