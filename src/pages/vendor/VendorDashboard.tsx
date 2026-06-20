import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient.js';

interface AnalyticsData {
  totalRevenue: number;
  netRevenue: number;
  totalOrders: number;
}

export default function VendorDashboard() {
  const { data: profile } = useQuery({
    queryKey: ['vendorProfile'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/profile');
      return res.data;
    }
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['vendorAnalytics'],
    queryFn: async () => {
      const res = await apiClient.get('/vendor/analytics');
      return res.data;
    }
  });

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
      <p className="text-gray-500">Welcome back, {profile.businessName}.</p>

      {profile.status !== 'ACTIVE' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your account status is currently: <span className="font-bold">{profile.status}</span>. 
                Some features may be limited until you are verified and ACTIVE.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded shadow p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Gross Revenue</h3>
            <p className="text-sm text-gray-500">Total sales value</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">${(analytics?.totalRevenue || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Net Revenue</h3>
            <p className="text-sm text-gray-500">After platform commission</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-600">${(analytics?.netRevenue || 0).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Total Orders</h3>
            <p className="text-sm text-gray-500">Orders successfully placed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
