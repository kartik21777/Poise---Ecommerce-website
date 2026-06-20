import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Globe, Star, AlertCircle } from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';

const fetchDashboardStats = async () => {
  const { data } = await apiClient.get('/admin/products/stats');
  return data;
};

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  const statCards = [
    { name: 'Total Products', value: stats?.total, icon: Package, color: 'bg-blue-500' },
    { name: 'Published', value: stats?.published, icon: Globe, color: 'bg-emerald-500' },
    { name: 'Featured', value: stats?.featured, icon: Star, color: 'bg-amber-500' },
    { name: 'Low Stock Alerts', value: stats?.lowStock, icon: AlertCircle, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
            <div className={`p-4 rounded-lg bg-opacity-10 mr-4 ${stat.color.replace('bg-', 'bg-').replace('500', '100')} text-${stat.color.split('-')[1]}-600`}>
              <stat.icon className={`h-8 w-8 ${stat.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
