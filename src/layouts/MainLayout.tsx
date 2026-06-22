import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar.js';
import { Footer } from '../components/Footer.js';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
