import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import * as authService from '../services/authService.js';
import { SEO } from '../components/SEO.js';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await authService.resetPassword({ token, newPassword: password });
      setStatus('success');
      setMessage('Password has been successfully reset. You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    }
  };

  if (status === 'success') {
    return (
      <>
        <SEO title="Password Reset" />
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Password Reset Complete</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>
        <div className="mt-6">
          <Link to="/login" className="font-medium text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">Go to login</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Choose New Password" />
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Choose a new password</h2>

      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
              <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
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

          <div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 transition-colors"
            >
              {status === 'loading' ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
