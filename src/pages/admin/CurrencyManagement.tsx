import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import {
  Globe,
  Coins,
  TrendingUp,
  Plus,
  Trash,
  Check,
  AlertCircle,
  RefreshCw,
  Tag
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Currency {
  _id: string;
  code: string;
  symbol: string;
  decimalPrecision: number;
  isBase: boolean;
  isActive: boolean;  // normalised from isEnabled
}

interface ExchangeRate {
  targetCurrency: string;
  rate: number;
}

interface ExchangeRateVersion {
  _id: string;
  versionNumber: number;
  baseCurrency: string;
  rates: ExchangeRate[];
  source: string;
  effectiveFrom: string;
  notes?: string;
  createdAt: string;
}

// API uses 'product' (populated ref), 'price', 'compareAtPrice', 'isEnabled'
interface RegionalPrice {
  _id: string;
  product: { _id: string; name: string; price: number } | null;
  variantSku: string | null;
  countryCode: string;
  currencyCode: string;
  price: number;
  compareAtPrice?: number;
  isEnabled: boolean;
  note?: string;
  createdAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rateHistory, setRateHistory] = useState<ExchangeRateVersion[]>([]);
  const [regionalOverrides, setRegionalOverrides] = useState<RegionalPrice[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Form state ──
  const [currencyForm, setCurrencyForm] = useState({
    code: '', symbol: '', decimalPrecision: 2, isBase: false, isActive: true,
  });

  const [rateFormInput, setRateFormInput] = useState('');
  const [rateTargetCurrency, setRateTargetCurrency] = useState('');

  const [overrideForm, setOverrideForm] = useState({
    productId: '', variantSku: '', countryCode: '', currencyCode: '',
    priceOverride: '', compareAtPriceOverride: '', note: '',
  });

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [currRes, ratesRes, overridesRes, prodsRes] = await Promise.all([
        apiClient.get('/admin/commerce/currencies'),
        apiClient.get('/admin/commerce/exchange-rates'),
        apiClient.get('/admin/commerce/regional-prices'),
        apiClient.get('/admin/products?limit=100'),
      ]);

      // Normalise isEnabled → isActive for Currency
      const currs = Array.isArray(currRes.data) ? currRes.data : [];
      setCurrencies(
        currs.map((c: any) => ({ ...c, isActive: c.isActive ?? c.isEnabled }))
      );

      setRateHistory(Array.isArray(ratesRes.data) ? ratesRes.data : []);

      const overrides = Array.isArray(overridesRes.data) ? overridesRes.data : [];
      setRegionalOverrides(
        overrides.map((o: any) => ({
          ...o,
          product: o.product ?? null,
          price: o.price ?? 0,
          compareAtPrice: o.compareAtPrice ?? undefined,
        }))
      );

      const prodsData = prodsRes.data?.data || prodsRes.data?.products || (Array.isArray(prodsRes.data) ? prodsRes.data : []);
      setProducts(Array.isArray(prodsData) ? prodsData : []);
    } catch (err: any) {
      console.error('[CurrencyManagement] fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load commerce settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.post('/admin/commerce/currencies', currencyForm);
      flash(`Currency ${currencyForm.code.toUpperCase()} created.`);
      setCurrencyForm({ code: '', symbol: '', decimalPrecision: 2, isBase: false, isActive: true });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create currency.');
    }
  };

  const handleToggleActiveCurrency = async (id: string, newState: boolean) => {
    try {
      setError('');
      await apiClient.put(`/admin/commerce/currencies/${id}`, { isActive: newState });
      flash('Currency updated.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update currency.');
    }
  };

  const handleSetBaseCurrency = async (id: string) => {
    try {
      setError('');
      await apiClient.put(`/admin/commerce/currencies/${id}`, { isBase: true });
      flash('Base currency updated.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not set base currency.');
    }
  };

  const handlePublishExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateTargetCurrency || !rateFormInput) {
      setError('Please provide a target currency and rate.');
      return;
    }
    try {
      setError('');
      await apiClient.post('/admin/commerce/exchange-rates', {
        rates: [{ targetCurrency: rateTargetCurrency.toUpperCase(), rate: Number(rateFormInput) }],
      });
      flash('Exchange rate published.');
      setRateFormInput('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not publish rate.');
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, variantSku, countryCode, currencyCode, priceOverride, compareAtPriceOverride, note } = overrideForm;
    if (!productId || !countryCode || !currencyCode || !priceOverride) {
      setError('Please fill all required override fields.');
      return;
    }
    try {
      setError('');
      await apiClient.post('/admin/commerce/regional-prices', {
        productId,
        variantSku: variantSku || null,
        countryCode: countryCode.toUpperCase(),
        currencyCode: currencyCode.toUpperCase(),
        priceOverride: Number(priceOverride),
        compareAtPriceOverride: compareAtPriceOverride ? Number(compareAtPriceOverride) : undefined,
        note,
      });
      flash(`Price override applied for ${countryCode.toUpperCase()}.`);
      setOverrideForm({ productId: '', variantSku: '', countryCode: '', currencyCode: '', priceOverride: '', compareAtPriceOverride: '', note: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not create price override.');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      setError('');
      await apiClient.delete(`/admin/commerce/regional-prices/${id}`);
      flash('Price override deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not delete override.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Globe className="text-indigo-600 h-6 w-6" /> Global Commerce &amp; Currency Core
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage currencies, exchange rates, and per-country price overrides.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload
        </button>
      </div>

      {/* Toasts */}
      {success && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-4 text-sm flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-500 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-4 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse font-mono text-sm">
          Loading commerce settings…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Currencies + Overrides list ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Currencies card */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-500" /> Currencies
                </h2>
                <span className="text-xs text-slate-400 font-mono">{currencies.length} total</span>
              </div>
              {currencies.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No currencies configured yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {currencies.map((c) => (
                    <div key={c._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-lg text-slate-950">{c.symbol} {c.code}</span>
                          {c.isBase && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                              Base
                            </span>
                          )}
                          {!c.isActive && (
                            <span className="bg-slate-100 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{c.decimalPrecision} decimal places</p>
                      </div>
                      <div className="flex gap-2">
                        {!c.isBase && (
                          <button
                            onClick={() => handleSetBaseCurrency(c._id)}
                            className="px-3 py-1 text-xs border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            Make Base
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleActiveCurrency(c._id, !c.isActive)}
                          disabled={c.isBase}
                          className={`px-3 py-1 text-xs rounded-lg transition ${
                            c.isActive
                              ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exchange Rate History */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-500" /> Exchange Rate History
                </h2>
                <span className="text-xs text-slate-400 font-mono">{rateHistory.length} version(s)</span>
              </div>
              {rateHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No exchange rates published yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {rateHistory.map((v) => (
                    <div key={v._id} className="p-5 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Version #{v.versionNumber}</span>
                        <span className="text-xs text-slate-400">{new Date(v.effectiveFrom || v.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-slate-100 text-slate-600 text-xs font-mono px-2 py-0.5 rounded">
                          Base: {v.baseCurrency || 'USD'}
                        </span>
                        {(v.rates || []).map((r) => (
                          <span key={r.targetCurrency} className="bg-indigo-50 text-indigo-700 text-xs font-mono px-2 py-0.5 rounded">
                            {r.targetCurrency}: {r.rate}
                          </span>
                        ))}
                      </div>
                      {v.notes && <p className="text-[11px] italic text-slate-400 mt-1">{v.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Regional Overrides list */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-50 border-b flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-500" /> Regional Price Overrides
                </h2>
                <span className="text-xs text-slate-500 bg-white border px-2.5 py-1 rounded-full font-mono">
                  {regionalOverrides.length} rule(s)
                </span>
              </div>
              {regionalOverrides.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">
                  No overrides yet. Auto-conversion will apply from exchange rates.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {regionalOverrides.map((o) => (
                    <div key={o._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{o.product?.name || 'Unknown Product'}</span>
                          {o.variantSku && (
                            <span className="font-mono text-[11px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded">
                              SKU: {o.variantSku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">
                            {o.countryCode}
                          </span>
                          <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-semibold">
                            {o.currencyCode} {o.price}
                          </span>
                          {o.compareAtPrice && (
                            <span className="text-slate-400 line-through">Was: {o.compareAtPrice}</span>
                          )}
                        </div>
                        {o.note && (
                          <p className="text-[11px] italic text-slate-400 mt-1">"{o.note}"</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteOverride(o._id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-transparent hover:border-rose-100"
                        title="Remove Override"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT: Forms ── */}
          <div className="space-y-8">

            {/* Add Currency */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-500" /> Add Currency
              </h3>
              <form onSubmit={handleCreateCurrency} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    ISO Code (e.g. INR, EUR)
                  </label>
                  <input
                    type="text" required maxLength={3}
                    placeholder="INR"
                    value={currencyForm.code}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Symbol (e.g. ₹, €)
                  </label>
                  <input
                    type="text" required
                    placeholder="₹"
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Decimal Places
                  </label>
                  <input
                    type="number" min={0} max={4}
                    value={currencyForm.decimalPrecision}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, decimalPrecision: Number(e.target.value) })}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currencyForm.isBase}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, isBase: e.target.checked })}
                    className="h-3.5 w-3.5"
                  />
                  Set as base currency
                </label>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white font-medium text-xs rounded-lg transition"
                >
                  Create Currency
                </button>
              </form>
            </div>

            {/* Publish Exchange Rate */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> Publish Exchange Rate
              </h3>
              <form onSubmit={handlePublishExchangeRate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Target Currency
                  </label>
                  <select
                    value={rateTargetCurrency}
                    onChange={(e) => setRateTargetCurrency(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">— Choose currency —</option>
                    {currencies.filter(c => !c.isBase && c.isActive).map(c => (
                      <option key={c._id} value={c.code}>{c.symbol} {c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Rate (1 Base = X Target)
                  </label>
                  <input
                    type="number" step="any" required
                    placeholder="e.g. 84"
                    value={rateFormInput}
                    onChange={(e) => setRateFormInput(e.target.value)}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition"
                >
                  Publish Rate
                </button>
              </form>
            </div>

            {/* Regional Price Override */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-indigo-500" /> Add Price Override
              </h3>
              <form onSubmit={handleCreateOverride} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Product
                  </label>
                  <select
                    value={overrideForm.productId}
                    onChange={(e) => setOverrideForm({ ...overrideForm, productId: e.target.value })}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">— Choose product —</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                    Variant SKU (optional)
                  </label>
                  <input
                    type="text" placeholder="TSHIRT-BLU-S"
                    value={overrideForm.variantSku}
                    onChange={(e) => setOverrideForm({ ...overrideForm, variantSku: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Country (IN, US…)
                    </label>
                    <input
                      type="text" required maxLength={2} placeholder="IN"
                      value={overrideForm.countryCode}
                      onChange={(e) => setOverrideForm({ ...overrideForm, countryCode: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Currency
                    </label>
                    <input
                      type="text" required maxLength={3} placeholder="INR"
                      value={overrideForm.currencyCode}
                      onChange={(e) => setOverrideForm({ ...overrideForm, currencyCode: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Override Price
                    </label>
                    <input
                      type="number" required placeholder="999"
                      value={overrideForm.priceOverride}
                      onChange={(e) => setOverrideForm({ ...overrideForm, priceOverride: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      List / Was Price
                    </label>
                    <input
                      type="number" placeholder="1499"
                      value={overrideForm.compareAtPriceOverride}
                      onChange={(e) => setOverrideForm({ ...overrideForm, compareAtPriceOverride: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text" placeholder="Summer Sale"
                    value={overrideForm.note}
                    onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition"
                >
                  Save Override
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
