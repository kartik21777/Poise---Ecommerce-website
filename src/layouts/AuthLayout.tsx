import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="w-full max-w-md space-y-8 p-10 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="pb-8 text-center">
          <Link to="/" className="text-3xl font-bold font-serif tracking-tight text-gray-900 dark:text-white">
            POISE
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
