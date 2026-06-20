import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as authService from '../services/authService.js';
import { SEO } from '../components/SEO.js';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
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
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Password Reset Complete</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <div className="mt-6">
          <Link to="/login" className="font-medium text-gray-900 hover:text-gray-700">Go to login</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Choose New Password" />
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Choose a new password</h2>
      
      <div className="mt-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {status === 'error' && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{message}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {status === 'loading' ? 'Resetting...' : 'Reset password'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
