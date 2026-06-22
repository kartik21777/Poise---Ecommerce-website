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
  Edit,
  DollarSign,
  Tag
} from 'lucide-react';

interface Currency {
  _id: string;
  code: string;
  symbol: string;
  decimalPrecision: number;
  isBase: boolean;
  isActive: boolean;
}

interface ExchangeRate {
  targetCurrency: string;
  rate: number;
}

interface ExchangeRateVersion {
  _id: string;
  versionNumber: number;
  rates: ExchangeRate[];
  creatorUserId: string;
  createdAt: string;
}

interface RegionalPrice {
  _id: string;
  productId: {
    _id: string;
    name: string;
    price: number;
  } | null;
  variantSku: string | null;
  countryCode: string;
  currencyCode: string;
  priceOverride: number;
  compareAtPriceOverride?: number;
  note?: string;
  createdAt: string;
}

export function CurrencyManagement() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [rateHistory, setRateHistory] = useState<ExchangeRateVersion[]>([]);
  const [regionalOverrides, setRegionalOverrides] = useState<RegionalPrice[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    symbol: '',
    decimalPrecision: 2,
    isBase: false,
    isActive: true
  });

  const [rateFormInput, setRateFormInput] = useState('');
  const [rateTargetCurrency, setRateTargetCurrency] = useState('');

  const [overrideForm, setOverrideForm] = useState({
    productId: '',
    variantSku: '',
    countryCode: '',
    currencyCode: '',
    priceOverride: '',
    compareAtPriceOverride: '',
    note: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [currRes, ratesRes, overridesRes, prodsRes] = await Promise.all([
        apiClient.get('/admin/commerce/currencies'),
        apiClient.get('/admin/commerce/exchange-rates'),
        apiClient.get('/admin/commerce/regional-prices'),
        apiClient.get('/admin/products?limit=100')
      ]);

      setCurrencies(currRes.data.map((currency: any) => ({
        ...currency,
        isActive: currency.isActive ?? currency.isEnabled,
      })));
      setRateHistory(ratesRes.data);
      setRegionalOverrides(overridesRes.data.map((override: any) => ({
        ...override,
        productId: override.productId ?? override.product,
        priceOverride: override.priceOverride ?? override.price,
        compareAtPriceOverride: override.compareAtPriceOverride ?? override.compareAtPrice,
      })));
      setProducts(prodsRes.data?.products || prodsRes.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load enterprise commerce settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSuccessMsg = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await apiClient.post('/admin/commerce/currencies', currencyForm);
      triggerSuccessMsg(`Currency ${currencyForm.code.toUpperCase()} successfully initialized.`);
      setCurrencyForm({
        code: '',
        symbol: '',
        decimalPrecision: 2,
        isBase: false,
        isActive: true
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not instantiate currency.');
    }
  };

  const handleToggleActiveCurrency = async (id: string, activeState: boolean) => {
    try {
      setError('');
      await apiClient.put(`/admin/commerce/currencies/${id}`, { isActive: activeState });
      triggerSuccessMsg('Currency properties modified.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not alter currency active state.');
    }
  };

  const handleSetBaseCurrency = async (id: string) => {
    try {
      setError('');
      await apiClient.put(`/admin/commerce/currencies/${id}`, { isBase: true });
      triggerSuccessMsg('Base currency redeployed. Catalog calculations rebuilt.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed setting the baseline currency.');
    }
  };

  const handlePublishExchangeRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateTargetCurrency || !rateFormInput) {
      setError('Please provide a target currency and custom multiplier.');
      return;
    }

    try {
      setError('');
      const payloadRates = [
        { targetCurrency: rateTargetCurrency.toUpperCase(), rate: Number(rateFormInput) }
      ];
      await apiClient.post('/admin/commerce/exchange-rates', { rates: payloadRates });
      triggerSuccessMsg(`Exchange rate version published successfully.`);
      setRateFormInput('');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not register currency multipliers.');
    }
  };

  const handleCreateOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, variantSku, countryCode, currencyCode, priceOverride, compareAtPriceOverride, note } = overrideForm;

    if (!productId || !countryCode || !currencyCode || !priceOverride) {
      setError('Please complete all pricing fields.');
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
        note
      });
      triggerSuccessMsg(`Regional price override successfully applied for ${countryCode.toUpperCase()}.`);
      setOverrideForm({
        productId: '',
        variantSku: '',
        countryCode: '',
        currencyCode: '',
        priceOverride: '',
        compareAtPriceOverride: '',
        note: ''
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed creating price override rules.');
    }
  };

  const handleDeleteOverride = async (id: string) => {
    try {
      setError('');
      await apiClient.delete(`/admin/commerce/regional-prices/${id}`);
      triggerSuccessMsg('Price rule deleted.');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not rescind region override rule.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Globe className="text-indigo-600 h-6 w-6" /> Global Commerce & Currency Core
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administer multi-currency listings, real-time conversion versions, regional overrides, and checkout taxes.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          className="mt-4 md:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg inline-flex items-center gap-2 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Catalog Schema
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg p-4 text-sm flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-500" /> {success}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded-lg p-4 text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse font-mono text-sm">
          Compiling regional registries...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Currencies Section */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Currencies Management Card */}
            <div className="bg-white border text-slate-800 border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-rose-105 bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-indigo-500" /> Activated Currency Indices
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {currencies.map((currency) => (
                  <div key={currency._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg text-slate-950">{currency.code}</span>
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs">Symbol: {currency.symbol}</span>
                        {currency.isBase && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Baseline Base
                          </span>
                        )}
                        {!currency.isActive && (
                          <span className="bg-slate-100 text-slate-400 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded">
                            Inactive / Silent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Precision setting: {currency.decimalPrecision} decimals
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!currency.isBase && (
                        <button
                          onClick={() => handleSetBaseCurrency(currency._id)}
                          className="px-3 py-1 text-xs border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          Make Base
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleToggleActiveCurrency(currency._id, !currency.isActive)}
                        className={`px-3 py-1 text-xs rounded-lg transition ${
                          currency.isActive
                            ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                        }`}
                        disabled={currency.isBase}
                      >
                        {currency.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Overrides Core View */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-indigo-505 text-indigo-500" /> Active Regional Price Overrides
                </h2>
                <span className="text-xs text-slate-500 bg-white border px-2.5 py-1 rounded-full font-mono">
                  {regionalOverrides.length} Rule(s)
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {regionalOverrides.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    No SKU pricing overrides active. Conversion logic will query baseline conversions dynamically.
                  </div>
                ) : (
                  regionalOverrides.map((override) => (
                    <div key={override._id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{override.productId?.name || 'Universal Rule'}</span>
                          {override.variantSku && (
                            <span className="font-mono text-[11px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded">
                              SKU: {override.variantSku}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">Country: {override.countryCode}</span>
                          <span className="bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700 font-mono font-semibold">OverridePrice: {override.currencyCode} {override.priceOverride}</span>
                          {override.compareAtPriceOverride && (
                            <span className="text-slate-400 line-through">List: {override.compareAtPriceOverride}</span>
                          )}
                        </div>
                        {override.note && (
                          <p className="text-[11px] italic text-slate-400 mt-1 font-sans">
                            Commentary: "{override.note}"
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteOverride(override._id)}
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition border border-transparent hover:border-rose-100"
                        title="Remove Override"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT: CONFIG & CREATION FORMS */}
          <div className="space-y-8">
            
            {/* Create Currency Form */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-indigo-5 w-4 text-indigo-500" /> New Currency Blueprint
              </h3>
              <form onSubmit={handleCreateCurrency} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    ISO Alphabetic Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INR, EUR, AUD"
                    maxLength={3}
                    value={currencyForm.code}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Symbol Glyph
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹, €, A$"
                    value={currencyForm.symbol}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Decimal Precision Points
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={currencyForm.decimalPrecision}
                    onChange={(e) => setCurrencyForm({ ...currencyForm, decimalPrecision: Number(e.target.value) })}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white font-medium text-xs rounded-lg transition"
                >
                  Register Currency
                </button>
              </form>
            </div>

            {/* Set Rates Form */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> Manual Exchange Rates
              </h3>
              <form onSubmit={handlePublishExchangeRate} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Destination Currency
                  </label>
                  <select
                    value={rateTargetCurrency}
                    onChange={(e) => setRateTargetCurrency(e.target.value)}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose target currency --</option>
                    {currencies.filter(c => !c.isBase && c.isActive).map(c => (
                      <option key={c._id} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Rate Multiplier (Base Currency to Target)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 84.5"
                    value={rateFormInput}
                    onChange={(e) => setRateFormInput(e.target.value)}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition"
                >
                  Publish New Rate Sheet
                </button>
              </form>
            </div>

            {/* Price Override Form */}
            <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-indigo-500" /> Catalog Price Override Rules
              </h3>
              <form onSubmit={handleCreateOverride} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Target Item / Product
                  </label>
                  <select
                    value={overrideForm.productId}
                    onChange={(e) => setOverrideForm({ ...overrideForm, productId: e.target.value })}
                    className="w-full text-slate-800 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 font-mono">
                    Variant SKU (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TSHIRT-BLU-S"
                    value={overrideForm.variantSku}
                    onChange={(e) => setOverrideForm({ ...overrideForm, variantSku: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 text-xs">
                      Iso Country Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IN, ES, DE"
                      maxLength={2}
                      value={overrideForm.countryCode}
                      onChange={(e) => setOverrideForm({ ...overrideForm, countryCode: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Iso Currency Code
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INR, EUR"
                      maxLength={3}
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
                      type="number"
                      required
                      placeholder="999.00"
                      value={overrideForm.priceOverride}
                      onChange={(e) => setOverrideForm({ ...overrideForm, priceOverride: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      List Price
                    </label>
                    <input
                      type="number"
                      placeholder="1499.00"
                      value={overrideForm.compareAtPriceOverride}
                      onChange={(e) => setOverrideForm({ ...overrideForm, compareAtPriceOverride: e.target.value })}
                      className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="Summer Sale Override"
                    value={overrideForm.note}
                    onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
                    className="w-full text-slate-800 placeholder-slate-400 text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition"
                >
                  Enforce Override Rule
                </button>
              </form>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
