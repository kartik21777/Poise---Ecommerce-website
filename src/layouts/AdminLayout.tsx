import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Package, Users, ShoppingCart, BarChart3, LogOut, CreditCard, Globe, Gift } from 'lucide-react';
import { useAuth } from '../providers/AuthProvider.js';

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Global Commerce', href: '/admin/commerce', icon: Globe },
    { name: 'Gift Cards & Wallet', href: '/admin/giftcards', icon: Gift },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-6 bg-slate-950">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Hexagon className="h-6 w-6 text-indigo-500 fill-indigo-500" />
            <span className="font-bold text-lg tracking-tight">STORE ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
