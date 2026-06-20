import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left pane - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="pb-8">
            <Link to="/" className="text-3xl font-bold font-serif tracking-tight text-gray-900">
              POISE
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
      {/* Right pane - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1491897554428-130a60dd4757?auto=format&fit=crop&q=80"
          alt="Abstract elegant background"
        />
        <div className="absolute inset-0 bg-gray-900 bg-opacity-20" />
      </div>
    </div>
  );
};
