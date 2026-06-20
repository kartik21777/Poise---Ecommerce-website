import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.js';

export const VendorLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 bg-gray-800 text-xl font-bold">
          Vendor Portal
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            <li>
              <Link to="/vendor" className="block px-4 py-2 hover:bg-gray-800">Dashboard</Link>
            </li>
            <li>
              <Link to="/vendor/products" className="block px-4 py-2 hover:bg-gray-800">My Products</Link>
            </li>
            <li>
              <Link to="/vendor/orders" className="block px-4 py-2 hover:bg-gray-800">Fulfillment</Link>
            </li>
            <li>
              <Link to="/vendor/payouts" className="block px-4 py-2 hover:bg-gray-800">Payouts</Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 bg-gray-800">
          <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded transition">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-800">Marketplace Vendor</h2>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
