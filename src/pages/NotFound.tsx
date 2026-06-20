import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO.js';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <SEO title="Page Not Found" />
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-9xl font-extrabold text-gray-900 font-serif">404</h1>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Page not found</h2>
        <p className="mt-2 text-base text-gray-500 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};
