import React, { useState, useEffect } from 'react';
import { Gift, CreditCard, Filter, Download, Plus, AlertCircle, Trash2, Shield, ArrowDownUp, RefreshCw, Layers } from 'lucide-react';

export const GiftCardManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cards' | 'storeCredit' | 'transactions' | 'liability' | 'loyaltyPlatform'>('liability');
  
  // Data States
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [storeCreditAccounts, setStoreCreditAccounts] = useState<any[]>([]);
  const [giftCardTxs, setGiftCardTxs] = useState<any[]>([]);
  const [storeCreditTxs, setStoreCreditTxs] = useState<any[]>([]);
  const [liabilityData, setLiabilityData] = useState<any>(null);
  const [currenciesList] = useState<string[]>(['USD', 'EUR', 'INR', 'GBP', 'AUD', 'CAD']);

  // Loyalty Data States
  const [loyaltyUsers, setLoyaltyUsers] = useState<any[]>([]);
  const [loyaltyAnalytics, setLoyaltyAnalytics] = useState<any>(null);
  const [loyaltyReconResult, setLoyaltyReconResult] = useState<any>(null);
  
  // Loyalty form states
  const [loyaltyAdjustUserEmail, setLoyaltyAdjustUserEmail] = useState('');
  const [loyaltyAdjustAmount, setLoyaltyAdjustAmount] = useState('50');
  const [loyaltyAdjustNote, setLoyaltyAdjustNote] = useState('Promo bonus award');
  const [reconcilingLoyalty, setReconcilingLoyalty] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Loading / Filter states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardStatusFilter, setCardStatusFilter] = useState('');
  const [cardSearch, setCardSearch] = useState('');

  // single gift card form
  const [singleValue, setSingleValue] = useState('100');
  const [singleCurrency, setSingleCurrency] = useState('USD');
  const [singleExpiry, setSingleExpiry] = useState('');
  const [singleUser, setSingleUser] = useState('');
  const [singleNote, setSingleNote] = useState('');

  // bulk gift cards form
  const [bulkCount, setBulkCount] = useState('10');
  const [bulkValue, setBulkValue] = useState('50');
  const [bulkCurrency, setBulkCurrency] = useState('USD');
  const [bulkExpiry, setBulkExpiry] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  // manual store credit credit form
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('25');
  const [creditCurrency, setCreditCurrency] = useState('USD');
  const [creditNote, setCreditNote] = useState('Direct administrative loyalty token reward credit');
  const [creditExpiryDays, setCreditExpiryDays] = useState('');

  // Fetch functions
  const fetchLiabilityReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/giftcards/liability-report');
      const data = await res.json();
      if (data.success) {
        setLiabilityData(data.data);
      } else {
        setError(data.message || 'Failed to fetch liability figures.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed connecting to database endpoints.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGiftCards = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/giftcards/cards';
      const params = new URLSearchParams();
      if (cardStatusFilter) params.append('status', cardStatusFilter);
      if (cardSearch) params.append('search', cardSearch);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setGiftCards(data.data);
      }
    } catch (err: any) {
      setError('Failed searching active gift cards.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreCreditAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/giftcards/store-credit');
      const data = await res.json();
      if (data.success) {
        setStoreCreditAccounts(data.data);
      }
    } catch (err: any) {
      setError('Failed fetching store credit customer accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsLedgers = async () => {
    setLoading(true);
    try {
      const resCard = await fetch('/api/admin/giftcards/cards/transactions');
      const cardData = await resCard.json();
      if (cardData.success) {
        setGiftCardTxs(cardData.data);
      }

      const resCredit = await fetch('/api/admin/giftcards/store-credit/transactions');
      const creditData = await resCredit.json();
      if (creditData.success) {
        setStoreCreditTxs(creditData.data);
      }
    } catch (err: any) {
      setError('Failed fetching transaction audit log histories.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoyaltyAdminUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/loyalty/admin/users');
      const data = await res.json();
      if (data.success) {
        setLoyaltyUsers(data.data);
      } else {
        setError(data.message || 'Failed to fetch active loyalty accounts.');
      }
    } catch (err: any) {
      setError('Could not connect to loyalty administration user service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoyaltyAdminAnalytics = async () => {
    try {
      const res = await fetch('/api/loyalty/admin/analytics');
      const data = await res.json();
      if (data.success) {
        setLoyaltyAnalytics(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching loyalty systems analytics:', err);
    }
  };

  const handleTriggerLoyaltyRecon = async () => {
    setReconcilingLoyalty(true);
    setLoyaltyReconResult(null);
    try {
      const res = await fetch('/api/loyalty/admin/reconciliation');
      const data = await res.json();
      if (data.success) {
        setLoyaltyReconResult(data.data);
      } else {
        setError(data.message || 'Reconciliation sweep report failed.');
      }
    } catch (err: any) {
      setError('Unexpected network interruption during core financial system audit.');
    } finally {
      setReconcilingLoyalty(false);
    }
  };

  const handleAdminLoadPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltyAdjustUserEmail.trim()) return;
    setLoadingPoints(true);
    setError(null);
    try {
      const res = await fetch('/api/loyalty/admin/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loyaltyAdjustUserEmail.trim(),
          points: Number(loyaltyAdjustAmount),
          note: loyaltyAdjustNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully loaded ${loyaltyAdjustAmount} points to user ${loyaltyAdjustUserEmail}!`);
        setLoyaltyAdjustUserEmail('');
        setLoyaltyAdjustAmount('50');
        setLoyaltyAdjustNote('Promo bonus award');
        await fetchLoyaltyAdminUsers();
        await fetchLoyaltyAdminAnalytics();
      } else {
        setError(data.message || 'Failed loading point adjustments.');
      }
    } catch (err: any) {
      setError('An error occurred posting points adjust parameters.');
    } finally {
      setLoadingPoints(false);
    }
  };

  const loadActiveData = () => {
    setError(null);
    if (activeTab === 'liability') fetchLiabilityReport();
    if (activeTab === 'cards') fetchGiftCards();
    if (activeTab === 'storeCredit') fetchStoreCreditAccounts();
    if (activeTab === 'transactions') fetchTransactionsLedgers();
    if (activeTab === 'loyaltyPlatform') {
      fetchLoyaltyAdminUsers();
      fetchLoyaltyAdminAnalytics();
    }
  };

  useEffect(() => {
    loadActiveData();
  }, [activeTab]);

  // Form submit triggers
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/giftcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalValue: Number(singleValue),
          currency: singleCurrency,
          expirationDate: singleExpiry || undefined,
          issuedTo: singleUser || undefined,
          note: singleNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully generated gift card code: ${data.data.code}`);
        setSingleValue('100');
        setSingleExpiry('');
        setSingleUser('');
        setSingleNote('');
        fetchGiftCards();
      } else {
        setError(data.message || 'Failed creating new gift card.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred generating gift card.');
    }
  };

  const handleCreateBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/giftcards/cards/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: Number(bulkCount),
          originalValue: Number(bulkValue),
          currency: bulkCurrency,
          expirationDate: bulkExpiry || undefined,
          note: bulkNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully batch generated ${data.count} secure non-sequential gift cards!`);
        setBulkCount('10');
        setBulkValue('50');
        setBulkExpiry('');
        setBulkNote('');
        fetchGiftCards();
      } else {
        setError(data.message || 'Failed bulk creating cards.');
      }
    } catch (err: any) {
      setError(err.message || 'Error executing bulk generation sequence.');
    }
  };

  const handleCreditStoreAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/admin/giftcards/store-credit/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: creditUserId,
          amount: Number(creditAmount),
          currency: creditCurrency,
          notes: creditNote,
          expirationDays: creditExpiryDays ? Number(creditExpiryDays) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully credited user wallet balance with ${creditCurrency} ${creditAmount}!`);
        setCreditUserId('');
        setCreditAmount('25');
        setCreditExpiryDays('');
        fetchStoreCreditAccounts();
      } else {
        setError(data.message || 'Failed crediting store credit account.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading store credit to subscriber ledger.');
    }
  };

  const handleDisableCard = async (id: string) => {
    if (!window.confirm('Are you absolutely sure you want to deactivate and disable this gift card permanently? All remaining balances will be locked.')) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/giftcards/cards/${id}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual administration disable command override.' }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Gift card disabled successfully.');
        fetchGiftCards();
      } else {
        setError(data.message || 'Deactivation command failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error disabling card.');
    }
  };

  // CSV downloads
  const handleExportCSV = () => {
    window.open('/api/admin/giftcards/cards/csv-export', '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Gift className="h-6 w-6 text-indigo-600" />
            Gift Cards & Credit Administration
          </h1>
          <p className="text-xs text-gray-500 font-sans mt-1">
            Bulk issue cryptographically secure non-sequential gift cards, load customer store credits, and track outstanding ledger liabilities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadActiveData}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 text-gray-700 font-sans transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-sans font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            CSV Export Cards
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('liability')}
          className={`px-4 py-2 text-sm font-medium border-b-2 font-sans transition-colors whitespace-nowrap ${
            activeTab === 'liability'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Outstanding Liabilities
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-4 py-2 text-sm font-medium border-b-2 font-sans transition-colors whitespace-nowrap ${
            activeTab === 'cards'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Gift Card Catalog
        </button>
        <button
          onClick={() => setActiveTab('storeCredit')}
          className={`px-4 py-2 text-sm font-medium border-b-2 font-sans transition-colors whitespace-nowrap ${
            activeTab === 'storeCredit'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Customer Wallets
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 font-sans transition-colors whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          System Ledgers
        </button>
        <button
          onClick={() => setActiveTab('loyaltyPlatform')}
          className={`px-4 py-2 text-sm font-medium border-b-2 font-sans transition-colors whitespace-nowrap ${
            activeTab === 'loyaltyPlatform'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Loyalty & Rewards Center
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Operational Constraint Error</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tab: Outstanding Liabilities Report Section */}
      {activeTab === 'liability' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liabilityData &&
              Object.entries(liabilityData).map(([currency, details]: any) => (
                <div key={currency} className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-lg font-bold font-sans text-gray-900">{currency} Financial Ledger</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 uppercase">
                      Outstanding Liability
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-sans">Active Gift Card Liabilities:</span>
                      <span className="font-bold font-mono text-gray-900">
                        {currency} {details.giftCard.outstandingActiveLiability.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-sans">Total Store Credit Liabilities:</span>
                      <span className="font-bold font-mono text-gray-900">
                        {currency} {details.storeCredit.outstandingLiability.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between text-base">
                      <span className="font-bold font-sans text-gray-800">Total Combined Debt:</span>
                      <span className="font-extrabold font-mono text-indigo-600">
                        {currency} {details.totalLiabilityCombined.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-1 mt-2">
                    <div className="flex justify-between text-gray-500">
                      <span>Original Issued Value:</span>
                      <span className="font-mono">{details.giftCard.originalIssuedValue}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Redeemed Value:</span>
                      <span className="font-mono">{details.giftCard.totalRedeemedValue}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Expired Value:</span>
                      <span className="font-mono text-red-500">{details.giftCard.totalExpiredValue}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick single creation */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 font-sans flex items-center gap-1.5">
                <Plus className="h-5 w-5 text-indigo-600" />
                Issue New Single Gift Card
              </h3>
              <form onSubmit={handleCreateSingle} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Original Denomination</label>
                    <input
                      type="number"
                      value={singleValue}
                      onChange={(e) => setSingleValue(e.target.value)}
                      required
                      placeholder="100"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                    <select
                      value={singleCurrency}
                      onChange={(e) => setSingleCurrency(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {currenciesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Date (Optional)</label>
                  <input
                    type="date"
                    value={singleExpiry}
                    onChange={(e) => setSingleExpiry(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Assign to Customer (Mongoose User ID - Optional)</label>
                  <input
                    type="text"
                    value={singleUser}
                    onChange={(e) => setSingleUser(e.target.value)}
                    placeholder="User ID link"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Internal Audit Note</label>
                  <input
                    type="text"
                    value={singleNote}
                    onChange={(e) => setSingleNote(e.target.value)}
                    placeholder="Purpose of issuance"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
                >
                  Generate Crytographic Gift Card
                </button>
              </form>
            </div>

            {/* Quick bulk generation */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h3 className="text-base font-semibold text-gray-900 font-sans flex items-center gap-1.5">
                <Layers className="h-5 w-5 text-indigo-600" />
                Bulk Campaign Gift Card Generator
              </h3>
              <form onSubmit={handleCreateBulk} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Quantity of Cards</label>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      required
                      placeholder="10"
                      min="1"
                      max="250"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Face Value (Original Balance)</label>
                    <input
                      type="number"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      required
                      placeholder="50"
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                    <select
                      value={bulkCurrency}
                      onChange={(e) => setBulkCurrency(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                    >
                      {currenciesList.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Date (Optional)</label>
                    <input
                      type="date"
                      value={bulkExpiry}
                      onChange={(e) => setBulkExpiry(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Tag / Batch Memo</label>
                  <input
                    type="text"
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="Winter Marketing Promo wave"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors"
                >
                  Generate Bulk Non-Sequential Keys
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Gift Cards List Dashboard */}
      {activeTab === 'cards' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50">
            <div className="flex flex-1 items-center gap-3">
              <input
                type="text"
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
                placeholder="Search Cards by Code..."
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 w-64 bg-white"
              />
              <select
                value={cardStatusFilter}
                onChange={(e) => setCardStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="REDEEMED">REDEEMED</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
              <button
                onClick={fetchGiftCards}
                className="bg-indigo-600 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-indigo-700"
              >
                Apply Filter
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase bg-gray-100">
                  <th className="px-5 py-3 font-sans">Card Code</th>
                  <th className="px-5 py-3 font-sans">Currency</th>
                  <th className="px-5 py-3 font-sans text-right">Face value</th>
                  <th className="px-5 py-3 font-sans text-right">Remaining Balance</th>
                  <th className="px-5 py-3 font-sans">Assigned User</th>
                  <th className="px-5 py-3 font-sans">Expires</th>
                  <th className="px-5 py-3 font-sans">Status</th>
                  <th className="px-5 py-3 font-sans text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm">
                {giftCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500 text-xs">
                      No gift cards match current search/filter settings.
                    </td>
                  </tr>
                ) : (
                  giftCards.map((card) => (
                    <tr key={card._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono font-bold text-gray-900 tracking-wider">
                        {card.code}
                      </td>
                      <td className="px-5 py-3 font-mono uppercase text-gray-650">{card.currency}</td>
                      <td className="px-5 py-3 font-mono text-right text-gray-600">
                        {card.currency} {card.originalValue}
                      </td>
                      <td className="px-5 py-3 font-mono text-right font-semibold text-gray-900">
                        {card.currency} {card.balance}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-650">
                        {card.issuedTo ? (
                          <div>
                            <span className="font-semibold block">{card.issuedTo.firstName} {card.issuedTo.lastName}</span>
                            <span className="text-gray-400 font-mono block">{card.issuedTo.email}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unassigned / Guest Code</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 font-mono">
                        {card.expirationDate ? new Date(card.expirationDate).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                          card.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : card.status === 'REDEEMED'
                            ? 'bg-blue-50 text-blue-700'
                            : card.status === 'EXPIRED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {card.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {card.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDisableCard(card._id)}
                            className="text-red-600 hover:text-red-950 text-xs font-sans font-medium hover:underline flex items-center justify-end gap-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Disable Card
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Customer Wallet List & Credits loading */}
      {activeTab === 'storeCredit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-150">
              <span className="text-sm font-semibold text-gray-800">Customer Wallet Balance Sheets</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold uppercase bg-gray-100 text-gray-550">
                    <th className="px-5 py-3">Customer User</th>
                    <th className="px-5 py-3">Currency</th>
                    <th className="px-5 py-3 text-right">Active Wallet Balance</th>
                    <th className="px-5 py-3">Wallet Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-sm">
                  {storeCreditAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-xs text-gray-500 font-sans">
                        No customer wallets loaded. Use the credit form to generate wallets.
                      </td>
                    </tr>
                  ) : (
                    storeCreditAccounts.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          {account.user ? (
                            <div>
                              <span className="font-semibold block text-gray-900">
                                {account.user.firstName} {account.user.lastName}
                              </span>
                              <span className="text-gray-450 text-xs font-mono block">
                                {account.user.email} (ID: {account.user._id})
                              </span>
                            </div>
                          ) : (
                            <span className="text-red-500 font-semibold text-xs font-sans">Orphaned Account Record</span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-gray-600">{account.currency}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-indigo-650">
                          {account.currency} {account.balance.toFixed(2)}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase ${
                            account.isEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {account.isEnabled ? 'Active Wallet' : 'Locked'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form loading store credits */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-950 font-sans flex items-center gap-1.5 border-b border-gray-150 pb-2">
              <CreditCard className="h-5 w-5 text-indigo-600" />
              Load Wallet / Loyalty Credit
            </h3>
            <form onSubmit={handleCreditStoreAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer User ID</label>
                <input
                  type="text"
                  value={creditUserId}
                  onChange={(e) => setCreditUserId(e.target.value)}
                  required
                  placeholder="Insert 24-character hex ID"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Credit Amount</label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    required
                    placeholder="100"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                  <select
                    value={creditCurrency}
                    onChange={(e) => setCreditCurrency(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {currenciesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expiration Lifespan (Days - Optional)</label>
                <input
                  type="number"
                  value={creditExpiryDays}
                  onChange={(e) => setCreditExpiryDays(e.target.value)}
                  placeholder="Never expires if empty"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ledger Transaction Purpose Note</label>
                <textarea
                  value={creditNote}
                  onChange={(e) => setCreditNote(e.target.value)}
                  required
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 text-gray-900"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-1.5"
              >
                <Shield className="h-4 w-4" />
                Commit Wallet Load Ledger Row
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab: System Transaction Ledgers view */}
      {activeTab === 'transactions' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Gift Card Transactions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-105 border-b border-gray-250 flex justify-between items-center bg-gray-50">
              <span className="font-semibold text-sm text-gray-900 font-sans flex items-center gap-1.5">
                <ArrowDownUp className="h-4 w-4 text-indigo-600" />
                Gift Card Transaction Audit Ledger
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs text-gray-550 sticky top-0 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Card / Date</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3 text-right">Ledger Delta Amount</th>
                    <th className="px-4 py-3">Note Memos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {giftCardTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">
                        No actions registered on gift card accounts.
                      </td>
                    </tr>
                  ) : (
                    giftCardTxs.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold block">{tx.giftCard?.code || 'Terminated Card'}</span>
                          <span className="text-gray-400 font-mono block">{new Date(tx.transactionDate).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            tx.type === 'ISSUANCE' ? 'bg-blue-50 text-blue-800'
                            : tx.type === 'REDEMPTION' ? 'bg-purple-50 text-purple-800'
                            : tx.type === 'REFUND' ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-540'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.note}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Store Credit Transactions */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-105 border-b border-gray-255 flex justify-between items-center bg-gray-50">
              <span className="font-semibold text-sm text-gray-900 font-sans flex items-center gap-1.5">
                <ArrowDownUp className="h-4 w-4 text-indigo-600" />
                Store Credit Audit Logs Ledger
              </span>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 text-xs text-gray-550 sticky top-0 uppercase border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">User / Date</th>
                    <th className="px-4 py-3">Action Type</th>
                    <th className="px-4 py-3 text-right">Ledger Delta Amount</th>
                    <th className="px-4 py-3">Memos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-xs">
                  {storeCreditTxs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-400">
                        No activities logged on customer wallets.
                      </td>
                    </tr>
                  ) : (
                    storeCreditTxs.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-semibold block text-gray-800">{tx.account?.user?.email || 'N/A'}</span>
                          <span className="text-gray-400 font-mono block">{new Date(tx.transactionDate).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            tx.type === 'CREDIT_LOAD' || tx.type === 'REFUND_CREDIT' ? 'bg-emerald-50 text-emerald-800'
                            : tx.type === 'DEBIT_SPEND' ? 'bg-purple-50 text-purple-800'
                            : 'bg-amber-50 text-amber-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-540'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.currency}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Loyalty & Rewards Center control panel Workspace */}
      {activeTab === 'loyaltyPlatform' && (
        <div className="space-y-8">
          {/* Section 1: Analytics and Systems Reconciliation Auditor */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Analytics Card */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 text-left">
              <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5 border-b border-gray-105 pb-2">
                <Shield className="h-5 w-5 text-indigo-605" />
                Loyalty float & Tier Distributions
              </h3>
              
              {loyaltyAnalytics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wide">Points Float</span>
                    <span className="text-xl font-bold text-slate-800 font-mono block mt-1">
                      {loyaltyAnalytics.totalPointsFloat || 0}
                    </span>
                    <span className="text-[9px] text-gray-400 font-sans">Active in circulation</span>
                  </div>
                  
                  <div className="bg-slate-50 border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wide">Awarded</span>
                    <span className="text-xl font-bold text-emerald-600 font-mono block mt-1">
                      {loyaltyAnalytics.cumulativePointsEarned || 0}
                    </span>
                    <span className="text-[9px] text-gray-400 font-sans">Cumulative ledger XP</span>
                  </div>

                  <div className="bg-slate-50 border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wide">Redeemed</span>
                    <span className="text-xl font-bold text-indigo-600 font-mono block mt-1">
                      {loyaltyAnalytics.cumulativePointsRedeemed || 0}
                    </span>
                    <span className="text-[9px] text-gray-400 font-sans">Offsets claimed</span>
                  </div>

                  <div className="bg-slate-50 border border-gray-100 p-3 rounded-xl">
                    <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wide">Affiliates</span>
                    <span className="text-xl font-bold text-purple-600 font-mono block mt-1">
                      {loyaltyAnalytics.totalReferralsRecorded || 0}
                    </span>
                    <span className="text-[9px] text-gray-400 font-sans">Ambassador listings</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">Loading metrics...</div>
              )}

              {loyaltyAnalytics?.tierSummary && (
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wide mb-2">Member Tier Distributions</span>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(loyaltyAnalytics.tierSummary).map(([tierName, count]: any) => (
                      <span key={tierName} className="font-mono text-xs px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg font-bold">
                        {tierName}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reconciliation Integrity Auditor (Section 10) */}
            <div className="bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 p-5 space-y-4 text-left relative overflow-hidden">
              <h3 className="text-sm font-bold text-indigo-350 tracking-wider flex items-center gap-1.5 uppercase border-b border-slate-750 pb-2">
                <Shield className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
                Ledger Reconciliation auditor
              </h3>
              <p className="text-xs text-slate-400 leading-normal font-sans">
                Sweeps all accounts against system ledger databases. Validates cache balances to prevent double-spends and calculate outlays.
              </p>

              <div>
                <button
                  type="button"
                  onClick={handleTriggerLoyaltyRecon}
                  disabled={reconcilingLoyalty}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-3 rounded-lg tracking-wider uppercase font-sans transition-colors flex justify-center items-center gap-1.5 shadow-md"
                >
                  {reconcilingLoyalty ? 'Auditing Ledgers...' : 'Run Reconciliation Audit'}
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {loyaltyReconResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1.5 text-xs font-sans">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">Audited Accs:</span>
                    <span className="font-bold text-white font-mono">{loyaltyReconResult.totalLoyaltyAccountsAudited}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-450">Mismatches:</span>
                    <span className={`font-extrabold font-mono ${loyaltyReconResult.discrepancyCount === 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {loyaltyReconResult.discrepancyCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 text-[10px]">
                    <span className="text-slate-500">Status Check:</span>
                    <span className="text-emerald-400 font-bold tracking-wider uppercase whitespace-nowrap">
                      {loyaltyReconResult.discrepancyCount === 0 ? 'VERIFIED PASS' : 'ISSUES CAPTURED'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Hand: Loader form */}
            <div className="bg-white border border-gray-250 rounded-xl p-6 space-y-4 shadow-sm text-left">
              <h3 className="text-base font-bold text-gray-950 tracking-tight flex items-center gap-1.5 border-b border-gray-105 pb-3">
                <Plus className="h-4.5 w-4.5 text-indigo-600" />
                Adjust / Load Loyalty Points
              </h3>
              <p className="text-xs text-gray-500 leading-normal font-sans">
                Manually append or deduct points from a user ledger profile. Negative points deduct accounts. All adjustments are written in transaction histories.
              </p>
              
              <form onSubmit={handleAdminLoadPoints} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-450 uppercase block font-sans">User Email Address</label>
                  <input
                    type="email"
                    required
                    value={loyaltyAdjustUserEmail}
                    onChange={(e) => setLoyaltyAdjustUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-450 uppercase block font-sans">Points Delta Value</label>
                  <input
                    type="number"
                    required
                    value={loyaltyAdjustAmount}
                    onChange={(e) => setLoyaltyAdjustAmount(e.target.value)}
                    placeholder="100 or -50"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-450 uppercase block font-sans">Audit Ledger Note</label>
                  <textarea
                    rows={2}
                    value={loyaltyAdjustNote}
                    onChange={(e) => setLoyaltyAdjustNote(e.target.value)}
                    placeholder="Promo bonus adjustment"
                    className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-905 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loadingPoints || !loyaltyAdjustUserEmail.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-lg tracking-wider uppercase font-sans transition-colors flex justify-center items-center gap-1 shadow-xs"
                >
                  {loadingPoints ? 'Committing Ledger Record...' : 'Apply Points Adjustment'}
                </button>
              </form>
            </div>

            {/* Right Hand: Directory of Loyalty Customer profiles */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-250 overflow-hidden shadow-sm flex flex-col justify-between">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900 font-sans flex items-center gap-1.5">
                  <Layers className="h-4.5 w-4.5 text-indigo-600" />
                  Loyalty Accounts directory
                </span>
                <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                  {loyaltyUsers.length} Active System Accounts
                </span>
              </div>
              
              <div className="overflow-x-auto grow">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-xs text-gray-550 sticky top-0 uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Customer User</th>
                      <th className="px-4 py-3">Tier Status</th>
                      <th className="px-4 py-3 text-right">Points Balance</th>
                      <th className="px-4 py-3 text-right">Lifetime Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-xs">
                    {loyaltyUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-400 font-sans italic">
                          No active loyalty accounts found in database.
                        </td>
                      </tr>
                    ) : (
                      loyaltyUsers.map((acct: any) => (
                        <tr key={acct._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-left">
                            <span className="font-bold block text-gray-800 truncate max-w-[170px]">
                              {acct.userId?.email || 'System user ID'}
                            </span>
                            <span className="text-gray-400 text-[10px] block font-mono">
                              ID: {acct.userId?._id || acct._id}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-left">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-indigo-50 border border-indigo-100 text-indigo-800">
                              {acct.currentTier || 'BRONZE'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-indigo-650">
                            {acct.pointsBalance} XP
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-500">
                            {acct.lifetimeEarned} XP
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
