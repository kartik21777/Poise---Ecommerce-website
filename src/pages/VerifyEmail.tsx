import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as authService from '../services/authService.js';
import { SEO } from '../components/SEO.js';

export const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      authService.verifyEmail(token)
        .then(res => {
          setStatus('success');
          setMessage(res.message);
        })
        .catch(err => {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Failed to verify email.');
        });
    } else {
      setStatus('error');
      setMessage('Verification token is missing.');
    }
  }, [token]);

  return (
    <div className="min-h-[50vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <SEO title="Verify Email" />
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Verifying your email...</h2>
        )}
        
        {status === 'success' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-green-600 mb-4">Email Verified Successfully</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800">
              Continue to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-red-600 mb-4">Verification Failed</h2>
            <p className="text-gray-500 mb-6">{message}</p>
            <Link to="/login" className="text-gray-900 hover:text-gray-700 font-medium">
              Return to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
