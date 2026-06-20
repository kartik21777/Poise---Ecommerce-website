import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Ticket, 
  Percent, 
  Users, 
  Mail, 
  BarChart3, 
  FlaskConical, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  History,
  ShieldCheck,
  Target
} from 'lucide-react';
import { apiClient } from '../../services/apiClient.js';

export const MarketingAnalytics: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'coupons' | 'promotions' | 'segments' | 'campaigns' | 'experiments'>('overview');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- FORM STATES ---
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 15,
    minOrderValue: 50,
    maxDiscountLimit: 200,
    maxUsage: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isDynamic: false,
    vendorScope: 'GLOBAL' as 'GLOBAL' | 'VENDOR',
  });

  const [promoForm, setPromoForm] = useState({
    name: '15% Off Over $100',
    description: 'Automatic cart discount over $100',
    type: 'CART_DISCOUNT' as 'CART_DISCOUNT' | 'PRODUCT_DISCOUNT' | 'CATEGORY_DISCOUNT' | 'BUY_X_GET_Y' | 'LOYALTY_MULTIPLIER',
    priority: 10,
    conditions: {
      minimumOrderValue: 100,
      minimumItemsCount: 0,
      requiredProductIds: [] as string[],
      loyaltyTierRequired: '',
    },
    reward: {
      discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
      discountValue: 15,
      loyaltyPointsMultiplier: 1,
    }
  });

  const [testAssign, setTestAssign] = useState({
    experimentName: 'Checkout Redesign',
    visitorId: 'visitor_123',
    result: ''
  });

  // --- QUERIES ---
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['marketing', 'metrics'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/analytics');
      return data;
    },
    refetchInterval: 15000 // auto refresh stats
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['marketing', 'coupons'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/coupons');
      return data;
    }
  });

  const { data: promotions, isLoading: promotionsLoading } = useQuery({
    queryKey: ['marketing', 'promotions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/promotions');
      return data;
    }
  });

  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: ['marketing', 'segments'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/segments');
      return data;
    }
  });

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['marketing', 'campaigns'],
    queryFn: async () => {
      const { data } = await apiClient.get('/marketing/campaigns');
      return data;
    }
  });

  // --- MUTATIONS ---
  const createCouponMut = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/marketing/coupons', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
      setMsg({ type: 'success', text: 'Coupon successfully generated!' });
      setCouponForm({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderValue: 50,
        maxDiscountLimit: 200,
        maxUsage: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isDynamic: false,
        vendorScope: 'GLOBAL',
      });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error occurred.' });
    }
  });

  const createPromotionMut = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.post('/marketing/promotions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'promotions'] });
      setMsg({ type: 'success', text: 'Automatic Promotion Rule successfully cataloged!' });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Error occurred.' });
    }
  });

  const runRecoveryCronMut = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/marketing/cron/abandoned-cart');
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
      setMsg({ type: 'success', text: `Cart Recovery run finished. Queued ${res.data?.campaignsCreated || 0} automated campaigns!` });
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to trigger.' });
    }
  });

  const testAssignmentMut = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/marketing/experiments/assign', payload);
      return data;
    },
    onSuccess: (data: any) => {
      setTestAssign(prev => ({ ...prev, result: data.variant }));
    }
  });

  const deleteCouponMut = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/marketing/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'coupons'] });
      setMsg({ type: 'success', text: 'Coupon deleted successfully' });
    }
  });

  const deletePromotionMut = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/marketing/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'promotions'] });
      setMsg({ type: 'success', text: 'Promotion rule deleted successfully' });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 rounded-2xl text-white">
        <div>
          <h1 className="text-2xl font-bold font-sans tracking-tight">Growth & Customer Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">
            Section 11 Suite: coupons ledger, automatic engine, customer segments, attribution, and determinism assignments.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => runRecoveryCronMut.mutate()} 
            disabled={runRecoveryCronMut.isPending}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <History className="h-4 w-4" />
            {runRecoveryCronMut.isPending ? 'Processing...' : 'Run Abandoned Recovery'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${msg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-medium">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-xs hover:underline uppercase tracking-wider font-semibold opacity-70">Dismiss</button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2">
        {[
          { tab: 'overview', name: 'Performance Overview', icon: BarChart3 },
          { tab: 'coupons', name: 'Coupon Engine', icon: Ticket },
          { tab: 'promotions', name: 'Automatic Promotions', icon: Percent },
          { tab: 'segments', name: 'Customer Segmentation', icon: Users },
          { tab: 'campaigns', name: 'Email Automation', icon: Mail },
          { tab: 'experiments', name: 'A/B Testing Experiments', icon: FlaskConical },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => { setActiveTab(item.tab as any); setMsg(null); }}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-all ${
              activeTab === item.tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-4 rounded-lg bg-indigo-50 text-indigo-600 mr-4">
                <Ticket className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Coupons Claimed</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {metricsLoading ? '...' : (metrics?.couponUsageStats?.totalRedemptions || 0)}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-4 rounded-lg bg-emerald-50 text-emerald-600 mr-4">
                <Percent className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Promo Deductions</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  ${metricsLoading ? '...' : (metrics?.couponUsageStats?.totalDiscountGiven || 0).toFixed(2)}
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-4 rounded-lg bg-amber-50 text-amber-600 mr-4">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Recovery Success</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {metricsLoading ? '...' : (metrics?.abandonedCartStats?.recoveryRatePercent || 0).toFixed(1)}%
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
              <div className="p-4 rounded-lg bg-rose-50 text-rose-600 mr-4">
                <Target className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">UTM Sessions</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">
                  {metricsLoading ? '...' : (metrics?.attributionStats?.trafficShare?.reduce((a: number, b: any) => a + b.count, 0) || 0)}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attribution stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Marketing Attribution & Traffic Sources
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium">Attribution Ledger</span>
              </div>
              <div className="space-y-4">
                {metrics?.attributionStats?.trafficShare?.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No active UTM/referral source traffic recorded yet.</p>
                ) : (
                  metrics?.attributionStats?.trafficShare?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800 capitalize">
                          {item._id.source || 'Direct'} / {item._id.medium || 'None'}
                        </span>
                        <span className="text-xs text-gray-400">Campaign: {item._id.campaign || 'N/A'}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
                        {item.count} sessions
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Promotions impact stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-500" />
                  Active Promotions Lift
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-medium">Automatic Rule Stats</span>
              </div>
              <div className="space-y-4">
                {metrics?.promotionPerformanceStats?.length === 0 ? (
                  <p className="text-sm text-gray-500 py-6 text-center">No active promotion claim data exists.</p>
                ) : (
                  metrics?.promotionPerformanceStats?.map((p: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{p._id || 'Standard Discount'}</span>
                        <span className="text-xs text-gray-400">Claim events: {p.timesApplied}</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                        -${(p.totalDiscountIssued || 0).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COUPON ENGINE TAB */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coupon creator */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
              <Plus className="h-5 w-5 text-indigo-600" />
              Generate Marketing Coupon
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Coupon Code</label>
                <input 
                  type="text" 
                  value={couponForm.code} 
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  placeholder="SAVE30" 
                  className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</label>
                  <select 
                    value={couponForm.discountType}
                    onChange={(e: any) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 bg-white rounded-lg focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FIXED_AMOUNT">Fixed $ Amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Value</label>
                  <input 
                    type="number" 
                    value={couponForm.discountValue} 
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Min Subtotal ($)</label>
                  <input 
                    type="number" 
                    value={couponForm.minOrderValue} 
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: Number(e.target.value) })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Expiry Date</label>
                  <input 
                    type="date" 
                    value={couponForm.expiresAt} 
                    onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">Dynamic User Specific</h4>
                  <p className="text-[10px] text-indigo-700">Enforce single redeemer constraint</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={couponForm.isDynamic}
                  onChange={(e) => setCouponForm({ ...couponForm, isDynamic: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
              </div>

              <button 
                onClick={() => createCouponMut.mutate(couponForm)}
                disabled={createCouponMut.isPending || !couponForm.code}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {createCouponMut.isPending ? 'Generating...' : 'Issue Coupon Code'}
              </button>
            </div>
          </div>

          {/* Catalog of coupons */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-50">Active Marketing Coupon Registry</h3>
            {couponsLoading ? (
              <p className="text-sm text-gray-500">Loading coupons...</p>
            ) : coupons?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No active coupons found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-widest bg-gray-50">
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Reduction</th>
                      <th className="py-2.5 px-3">Limits (Usage)</th>
                      <th className="py-2.5 px-3">Vendor / Scope</th>
                      <th className="py-2.5 px-3">Expires</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {coupons?.map((c: any) => (
                      <tr key={c._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600">{c.code}</td>
                        <td className="py-3 px-3">
                          {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
                          <span className="block text-[10px] text-gray-400">Min: ${c.minOrderValue}</span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">
                          {c.usageCount} / {c.maxUsage || '∞'}
                          {c.isDynamic && <span className="ml-1.5 inline-block text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded">Dynamic</span>}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${c.vendorScope === 'GLOBAL' ? 'bg-indigo-50 text-indigo-700' : 'bg-pink-50 text-pink-700'}`}>
                            {c.vendorScope}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400 text-xs">
                          {new Date(c.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button 
                            onClick={() => { if(confirm('Delete coupon?')) deleteCouponMut.mutate(c._id); }}
                            className="text-xs text-rose-600 hover:underline font-semibold"
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUTOMATIC PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
              <Plus className="h-5 w-5 text-emerald-600" />
              Configure Promotion Rule
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Promotion Title</label>
                <input 
                  type="text" 
                  value={promoForm.name} 
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Promo Description</label>
                <input 
                  type="text" 
                  value={promoForm.description} 
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Category Type</label>
                  <select 
                    value={promoForm.type}
                    onChange={(e: any) => setPromoForm({ ...promoForm, type: e.target.value })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 bg-white rounded-lg"
                  >
                    <option value="CART_DISCOUNT">Cart Subtotal Discount</option>
                    <option value="LOYALTY_MULTIPLIER">Loyalty point multiplier</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Required Minimum Subtotal</label>
                  <input 
                    type="number" 
                    value={promoForm.conditions.minimumOrderValue} 
                    onChange={(e) => setPromoForm({ 
                      ...promoForm, 
                      conditions: { ...promoForm.conditions, minimumOrderValue: Number(e.target.value) } 
                    })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Benefit Type</label>
                  <select 
                    value={promoForm.reward.discountType}
                    onChange={(e: any) => setPromoForm({ 
                      ...promoForm, 
                      reward: { ...promoForm.reward, discountType: e.target.value } 
                    })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 bg-white rounded-lg"
                  >
                    <option value="PERCENTAGE">Percent %</option>
                    <option value="FIXED_AMOUNT">Flat Amount $</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Benefit Weight</label>
                  <input 
                    type="number" 
                    value={promoForm.reward.discountValue} 
                    onChange={(e) => setPromoForm({ 
                      ...promoForm, 
                      reward: { ...promoForm.reward, discountValue: Number(e.target.value) } 
                    })}
                    className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <button 
                onClick={() => createPromotionMut.mutate(promoForm)}
                disabled={createPromotionMut.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {createPromotionMut.isPending ? 'Publishing...' : 'Deploy Auto Promotion'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-2 border-b border-slate-50">Active Auto-Marketing Promotions</h3>
            {promotionsLoading ? (
              <p className="text-sm text-gray-500">Loading automatic promotions...</p>
            ) : promotions?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">No automatic promotions found.</p>
            ) : (
              <div className="space-y-3">
                {promotions?.map((p: any) => (
                  <div key={p._id} className="flex justify-between items-start p-4 hover:bg-slate-50/50 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        {p.name}
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Active</span>
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                      <div className="flex gap-4 text-xs text-gray-400 mt-2">
                        <span>Type: <strong className="text-slate-600">{p.type}</strong></span>
                        <span>Min Spending: <strong className="text-slate-600">${p.conditions.minimumOrderValue}</strong></span>
                        <span>Priority: <strong className="text-slate-600">{p.priority}</strong></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="text-sm font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                        {p.reward.discountType === 'PERCENTAGE' ? `${p.reward.discountValue}% Off` : `$${p.reward.discountValue} Off`}
                      </span>
                      <button 
                        onClick={() => { if(confirm('Revoke active promotion rule?')) deletePromotionMut.mutate(p._id); }}
                        className="text-xs text-rose-500 hover:underline font-bold"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER SEGMENTATION TAB */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-950">Dynamic Customer Segmentation Groups</h3>
            <p className="text-xs text-gray-400 -mt-2">Evaluated server-side in real-time based on transaction volumes, historic retention metrics and loyal state status.</p>

            {segmentsLoading ? (
              <p className="text-sm text-gray-500">Loading segments...</p>
            ) : segments?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No segment groups bootstapped.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {segments?.map((s: any) => (
                  <div key={s._id} className="border border-slate-100 rounded-2xl p-5 hover:indigo-glow transition-all bg-white relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 h-16 w-16 bg-slate-50 rounded-bl-full flex items-center justify-end p-3 text-indigo-500/10">
                      <Users className="h-6 w-6" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-base">{s.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                    
                    <div className="mt-4 pt-4 border-t border-slate-50 space-y-2 text-xs text-slate-500">
                      <div className="flex justify-between">
                        <span>Retention Constraint:</span>
                        <strong className="text-slate-800">{s.rules.minOrdersCount || 0} orders</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Spend Minimum:</span>
                        <strong className="text-slate-800">${s.rules.minSpendAmount || 0} USD</strong>
                      </div>
                      {s.rules.loyaltyTiers && s.rules.loyaltyTiers.length > 0 && (
                        <div className="flex justify-between">
                          <span>Loyalty Scope:</span>
                          <strong className="text-indigo-600 font-bold capitalize">{s.rules.loyaltyTiers.join(', ')}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EMAIL AUTOMATION TAB */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                Automated Customer Email Campaign Queue
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold font-mono">CRON Triggerable</span>
            </div>

            {campaignsLoading ? (
              <p className="text-sm text-gray-500">Loading campaigns queue...</p>
            ) : campaigns?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-12">Campaign logs empty. Use "Run Abandoned Recovery" to scan active cart leaks.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-widest bg-gray-50">
                      <th className="py-2.5 px-3">Subject & Target</th>
                      <th className="py-2.5 px-3">Campaign Group</th>
                      <th className="py-2.5 px-3">Scheduled / Sent</th>
                      <th className="py-2.5 px-3 font-medium">Conversion Event</th>
                      <th className="py-2.5 px-3">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {campaigns?.map((camp: any) => (
                      <tr key={camp._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-800">{camp.subject}</span>
                          <span className="block text-xs text-gray-400">Target User: {camp.userId?.toString() || 'User'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-600 capitalize text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {camp.campaignType}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-400">
                          {new Date(camp.scheduledAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          {camp.converted ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                              <CheckCircle className="h-3 w-3" /> Recovered
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">Scheduled</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                            camp.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' :
                            camp.status === 'QUEUED' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPERIMENTS TAB */}
      {activeTab === 'experiments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-950 flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-indigo-500" />
              A/B Testing Deterministic Assignment Playground
            </h3>
            <p className="text-xs text-gray-400">
              Validate the crypto-deterministic assignment mechanism. Users with the same ID always receive the same sticky bucket variant.
            </p>

            <div className="space-y-4 text-sm mt-3 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active Test Scenario Name</label>
                <select 
                  value={testAssign.experimentName} 
                  onChange={(e) => setTestAssign({ ...testAssign, experimentName: e.target.value, result: '' })}
                  className="w-full text-sm mt-1 p-2 border border-gray-200 bg-white rounded-lg"
                >
                  <option value="Checkout Redesign">Checkout Redesign (A/B Test)</option>
                  <option value="Personalized Recommendations Slider">Recommendation Placement (Variant A/B/C)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Visitor / Client Cookie ID</label>
                <input 
                  type="text"
                  value={testAssign.visitorId}
                  onChange={(e) => setTestAssign({ ...testAssign, visitorId: e.target.value, result: '' })}
                  className="w-full text-sm mt-1 p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>

              <button 
                onClick={() => testAssignmentMut.mutate({ experimentName: testAssign.experimentName, visitorId: testAssign.visitorId })}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Determine Sticky Assignment
              </button>

              {testAssign.result && (
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-900 mt-2 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">Hash Match Algorithm:</span>
                    <strong className="text-slate-800 font-mono">Determinism Secure</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-indigo-100/30">
                    <span className="font-bold text-slate-700">Variant Assigned:</span>
                    <strong className="text-indigo-700 font-extrabold uppercase font-mono bg-indigo-100 px-3 py-1 rounded-md text-base tracking-wider">
                      {testAssign.result}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Active Campaign Experiments</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Live</span>
                <h4 className="font-bold text-slate-800">Checkout Redesign</h4>
                <p className="text-xs text-slate-400 mt-1">Comparing 1-step checkout versus multi-step wizard logic.</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Variants: <strong>2 (CONTROL, VARIANT_A)</strong></span>
                  <span>Traffic Split: <strong>50% / 50%</strong></span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Live</span>
                <h4 className="font-bold text-slate-800">Recommendation Placement</h4>
                <p className="text-xs text-slate-400 mt-1">Testing high versus bottom display of product recommendations list on catalog listings.</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Variants: <strong>3 (CONTROL, HYBRID, SIMILARITY)</strong></span>
                  <span>Traffic Split: <strong>34% / 33% / 33%</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
