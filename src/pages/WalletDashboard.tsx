import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Gift, 
  ArrowDownUp, 
  RefreshCw, 
  PlusCircle, 
  CreditCard, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Award,
  Sparkles,
  Share2,
  Users,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const WalletDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'wallet' | 'loyalty'>('wallet');
  const [data, setData] = useState<any>(null);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Wallet states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);

  // Loyalty states
  const [sponsorCode, setSponsorCode] = useState('');
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);
  const [claimingReferral, setClaimingReferral] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchAllDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, loyaltyRes] = await Promise.all([
        fetch('/api/wallet/dashboard'),
        fetch('/api/loyalty/dashboard')
      ]);

      const walletJson = await walletRes.json();
      const loyaltyJson = await loyaltyRes.json();

      if (walletJson.success) {
        setData(walletJson.data);
      } else {
        setError(walletJson.message || 'Failed loading commerce wallet.');
      }

      if (loyaltyJson.success) {
        setLoyaltyData(loyaltyJson.data);
      } else {
        console.warn('Loyalty platform registration pending or error:', loyaltyJson.message);
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to the remote platform endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const handleRedeemGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    setRedeeming(true);
    setError(null);
    setRedeemSuccess(null);
    try {
      const res = await fetch('/api/wallet/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setRedeemSuccess(json.message);
        setRedeemCode('');
        await fetchAllDashboardData();
      } else {
        setError(json.message || 'Redemption request failed.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred during gift card redemption.');
    } finally {
      setRedeeming(false);
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorCode.trim()) return;
    setClaimingReferral(true);
    setError(null);
    setReferralSuccess(null);
    try {
      const res = await fetch('/api/loyalty/claim-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: sponsorCode.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReferralSuccess(json.message || 'Referral connection securely loaded!');
        setSponsorCode('');
        await fetchAllDashboardData();
      } else {
        setError(json.message || 'Failed to claim referral sponsor code.');
      }
    } catch (err: any) {
      setError('An unexpected error occurred connecting referral.');
    } finally {
      setClaimingReferral(false);
    }
  };

  const copyReferralToClipboard = () => {
    if (!loyaltyData?.account?.referralCode) return;
    const shareUrl = `${window.location.origin}/register?ref=${loyaltyData.account.referralCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Process progression logic
  let tierProgressPercent = 0;
  let pointsForNextTier = 0;
  let nextTierName = '';
  let activeTierMultiplier = 1.0;

  if (loyaltyData?.account && loyaltyData?.tierConfigs) {
    const currentPoints = loyaltyData.account.pointsBalance || 0;
    const currentTierName = loyaltyData.account.currentTier || 'BRONZE';
    
    const sortedConfigs = [...loyaltyData.tierConfigs].sort(
      (a: any, b: any) => a.qualificationThresholdPoints - b.qualificationThresholdPoints
    );
    
    const activeConfig = sortedConfigs.find((c: any) => c.tier === currentTierName);
    activeTierMultiplier = activeConfig?.earningMultiplier || 1.0;

    const currentIndex = sortedConfigs.findIndex((c: any) => c.tier === currentTierName);
    const nextConfig = currentIndex !== -1 && currentIndex < sortedConfigs.length - 1 
      ? sortedConfigs[currentIndex + 1] 
      : null;

    if (nextConfig) {
      nextTierName = nextConfig.tier;
      const baseThreshold = activeConfig ? activeConfig.qualificationThresholdPoints : 0;
      const limitThreshold = nextConfig.qualificationThresholdPoints;
      const range = limitThreshold - baseThreshold;
      const currentProgressValue = currentPoints - baseThreshold;

      tierProgressPercent = Math.max(0, Math.min(100, Math.round((currentProgressValue / (range || 1)) * 100)));
      pointsForNextTier = Math.max(0, limitThreshold - currentPoints);
    } else {
      tierProgressPercent = 100; // Maximized tier configuration
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 min-h-[70vh]">
      {/* Wallet Banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10">
          <Wallet className="h-64 w-64 text-white -mr-12 -mb-12" />
        </div>
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/200/25 text-indigo-350 text-xs font-semibold uppercase tracking-wider font-sans">
              Verified Wallet & Perks
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans text-white">Your Personal Commerce Wallet</h1>
          <p className="text-sm text-slate-400 dark:text-gray-500 font-sans max-w-lg">
            View available multi-currency store credits, redeem secure systems gift cards, and track your points tier progression.
          </p>
        </div>
        <div className="relative z-10 flex-shrink-0">
          <button
            onClick={fetchAllDashboardData}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-750 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl text-xs font-semibold tracking-wide uppercase text-white font-sans"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-left w-full">
            <h4 className="text-sm font-semibold text-red-800">Operational Notice</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {redeemSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 col-span-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="text-sm font-semibold text-emerald-800">Redemption Successful</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{redeemSuccess}</p>
          </div>
        </div>
      )}

      {referralSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-xl flex items-start gap-3 col-span-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="text-sm font-semibold text-emerald-800">Sponsor Link Confirmed</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{referralSuccess}</p>
          </div>
        </div>
      )}

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-6 py-3.5 text-sm font-bold tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all font-sans ${
            activeTab === 'wallet'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white dark:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Store Credit & Cards
        </button>
        <button
          onClick={() => setActiveTab('loyalty')}
          className={`px-6 py-3.5 text-sm font-bold tracking-tight uppercase flex items-center gap-2 border-b-2 transition-all font-sans relative ${
            activeTab === 'loyalty'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white dark:text-white'
          }`}
        >
          <Award className="h-4 w-4" />
          Loyalty & Ambassador Rewards
          {loyaltyData?.account?.pointsBalance > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-50 dark:bg-indigo-900/205"></span>
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-gray-400 dark:text-gray-500 space-y-3 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-gray-400 dark:text-gray-500">Syncing live balances and high-integrity ledger audits...</p>
        </div>
      ) : activeTab === 'wallet' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Store Credit and Ledger Logs */}
          <div className="md:col-span-2 space-y-6">
            {/* Store Credit Cards */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Store Credit Accounts
              </h3>

              {!data || data.storeCredit.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-sans">You currently do not have store credits registered in any currency.</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Wallet balances are activated instantly when gift cards are redeemed.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.storeCredit.map((acct: any) => (
                    <div key={acct._id} className="bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Ledger Managed</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-900/200 shadow-xs" />
                      </div>
                      <div className="font-mono font-extrabold text-2xl text-slate-900 dark:text-white">
                        {acct.currency} {acct.balance.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans leading-tight">
                        Applies instantly as payment offset during active checkouts.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet Ledger Logs */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <ArrowDownUp className="h-5 w-5 text-indigo-600" />
                Wallet Ledger Audit History
              </h3>

              {!data || (data.history.storeCreditTransactions.length === 0 && data.history.giftCardTransactions.length === 0) ? (
                <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-500 italic">
                  Your commerce wallet transaction history is empty.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {/* Store Credit Line Items */}
                  {data.history.storeCreditTransactions.map((tx: any) => (
                    <div key={tx._id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3 text-sm hover:bg-slate-50 dark:hover:bg-gray-800 dark:bg-gray-800 p-2 text-left rounded-lg transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase font-sans ${
                            tx.type === 'CREDIT_LOAD' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' : tx.type === 'DEBIT_SPEND' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700'
                          }`}>
                            {tx.type === 'CREDIT_LOAD' ? 'Credit Loaded' : tx.type === 'DEBIT_SPEND' ? 'Checkout offsets' : 'Offsets Refund'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-sans">{tx.notes}</p>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          {new Date(tx.transactionDate).toLocaleString()} 
                          {tx.orderId && ` • Order: ${tx.orderId.orderNumber || tx.orderId}`}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-right text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                      </div>
                    </div>
                  ))}

                  {/* Gift Card Line Items */}
                  {data.history.giftCardTransactions.map((tx: any) => (
                    <div key={tx._id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3 text-sm hover:bg-slate-50 dark:hover:bg-gray-800 dark:bg-gray-800 p-2 text-left rounded-lg transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-purple-50 dark:bg-purple-900/20 text-purple-700 font-sans mr-2">
                            Digital Certificate
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-sans">{tx.note}</p>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          {new Date(tx.transactionDate).toLocaleString()} 
                          {tx.giftCard && ` • Card: ${tx.giftCard.code || 'CERTIFICATE'}`}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-right text-sm ${tx.amount > 0 ? 'text-purple-600' : 'text-slate-850 dark:text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Redemption & Owned Digital Gift Certificates */}
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-gray-800 border border-indigo-50 dark:border-indigo-900/30 rounded-xl p-5 space-y-4 shadow-3xs">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wider font-sans flex items-center gap-1.5 uppercase border-b border-gray-200 dark:border-gray-700 pb-2">
                <PlusCircle className="h-4 w-4 text-indigo-600" />
                Redeem Gift Card code
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-sans leading-relaxed">
                Enter your physical unique certificate code below to load its full value as store credit.
              </p>
              <form onSubmit={handleRedeemGiftCard} className="space-y-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  required
                  placeholder="GC-XXXX-XXXX-XXXX"
                  className="w-full text-center font-mono font-bold uppercase tracking-wider text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-520"
                />
                <button
                  type="submit"
                  disabled={redeeming || !redeemCode.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-lg tracking-wider uppercase font-sans transition-colors flex justify-center items-center gap-1"
                >
                  {redeeming ? 'Validating Keys...' : 'Redeem to Wallet Credit'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 shadow-3xs">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wider font-sans flex items-center gap-1.5 uppercase border-b border-gray-200 dark:border-gray-700 pb-2">
                <Gift className="h-4.5 w-4.5 text-indigo-600" />
                Certificates Issued For You
              </h3>

              {!data || data.giftCards.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic font-sans text-center">
                  No direct gift cards located for your email address.
                </p>
              ) : (
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto font-sans pr-1">
                  {data.giftCards.map((card: any) => (
                    <div key={card._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-slate-50 dark:bg-gray-800 space-y-2 text-left shadow-4xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 tracking-wide select-all">
                          {card.code}
                        </span>
                        <span className={`text-[9px] uppercase font-bold px-1.5 rounded ${
                          card.status === 'ACTIVE' 
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' 
                            : card.status === 'EXPIRED'
                            ? 'text-slate-600 bg-slate-100'
                            : 'text-red-600 bg-red-50'
                        }`}>
                          {card.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Claims Value:</span>
                        <span className="font-mono font-bold text-sm text-gray-950">
                          {card.currency} {card.balance}
                        </span>
                      </div>
                      {card.expirationDate && (
                        <div className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                          Expiration: {new Date(card.expirationDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Loyalty & Ambassador Rewards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Points metrics, Tier Progression, and Ledger Logs */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Loyalty Points Metrics Overview Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-left">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-505" />
                    Points Ledger & Tier Perks
                  </h3>
                  <p className="text-xs text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans">
                    Your active points and dynamic tier multiplication level.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 font-extrabold text-xs px-2.5 py-1 rounded-full font-mono uppercase tracking-wide">
                  <Award className="h-3.5 w-3.5" />
                  {loyaltyData?.account?.currentTier || 'BRONZE'} TIER
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase font-sans">Points Balance</span>
                  <p className="font-mono text-3xl font-extrabold text-indigo-650 mt-1">
                    {loyaltyData?.account?.pointsBalance || 0}
                  </p>
                  <span className="text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans mt-1">
                    ≈ ₹{((loyaltyData?.account?.pointsBalance || 0) * 0.84).toFixed(2)} Purchase discount
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between text-left">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase font-sans">Tier Multiplier</span>
                  <p className="font-mono text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                    {activeTierMultiplier}x
                  </p>
                  <span className="text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans mt-1 animate-pulse">
                    {(activeTierMultiplier - 1.0) * 100 > 0 
                      ? `+${Math.round((activeTierMultiplier - 1.0) * 100)}% points on checkout` 
                      : 'Base earning rate'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 p-4 rounded-xl flex flex-col justify-between text-left col-span-2 md:col-span-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase font-sans">Total Redeemed</span>
                  <p className="font-mono text-2xl font-extrabold text-slate-505 mt-1">
                    {loyaltyData?.account?.lifetimeRedeemed || 0} Points
                  </p>
                  <span className="text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans mt-1">
                    Lifetime Saved: ₹{((loyaltyData?.account?.lifetimeRedeemed || 0) * 0.84).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Progress Tracking Bar */}
              {nextTierName ? (
                <div className="space-y-2.5 text-left bg-slate-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans font-semibold text-gray-650 flex items-center gap-1 text-slate-700">
                      Progression to <span className="text-indigo-600 font-bold uppercase">{nextTierName}</span> Status
                    </span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">
                      {tierProgressPercent}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner flex">
                    <div 
                      style={{ width: `${tierProgressPercent}%` }} 
                      className="bg-gradient-to-r from-indigo-505 to-indigo-650 h-full rounded-full transition-all duration-1000"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500 font-sans">
                    <span>Current: {loyaltyData.account.pointsBalance} XP</span>
                    <span className="font-medium text-indigo-600">
                      Earn {pointsForNextTier} more points to unlock higher cashback rewards!
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 dark:bg-indigo-900/20/40 border border-indigo-100 rounded-xl p-4 text-center space-y-1.5 flex items-center justify-center gap-3">
                  <Award className="h-6 w-6 text-yellow-500 animate-bounce flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-indigo-900 uppercase">Tier Master Attained</p>
                    <p className="text-[11px] text-indigo-600">You are on the highest verified tier. Enjoy maximum lifetime cashback multipliers!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Points Ledger Rows Card */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                <ArrowDownUp className="h-5 w-5 text-indigo-600" />
                Loyalty Points Ledger Audit
              </h3>

              {!loyaltyData || !loyaltyData.transactions || loyaltyData.transactions.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400 dark:text-gray-500 italic">
                  No operations recorded on your points ledger yet.
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {loyaltyData.transactions.map((tx: any) => (
                    <div key={tx._id} className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3 text-sm hover:bg-slate-50 dark:hover:bg-gray-800 dark:bg-gray-800 p-2 text-left rounded-lg transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase font-sans ${
                            tx.type === 'EARN' 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700' 
                              : tx.type === 'REDEEM' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' 
                              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700'
                          }`}>
                            {tx.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 font-sans">{tx.notes}</p>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                          {new Date(tx.createdAt).toLocaleString()} 
                          {tx.orderId && ` • Order: ${tx.orderId.orderNumber || tx.orderId}`}
                        </div>
                      </div>
                      <div className={`font-mono font-bold text-right text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-650'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount} XP
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Affiliate Copy and Claim Referral Link */}
          <div className="space-y-6">
            
            {/* Affiliate Sharing Link Card */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold tracking-wider font-sans flex items-center gap-1.5 uppercase text-indigo-350 border-b border-slate-750 pb-2">
                <Share2 className="h-4 w-4" />
                Your Affiliate Code link
              </h3>
              <p className="text-xs text-slate-400 dark:text-gray-500 font-sans leading-relaxed text-left">
                Invite friends! When they register via your link, they receive rewards during signup, and you receive milestone points upon their checkout completion!
              </p>

              {loyaltyData?.account?.referralCode ? (
                <div className="space-y-2">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex justify-between items-center text-xs font-mono">
                    <span className="text-indigo-350 select-all font-bold">
                      {loyaltyData.account.referralCode}
                    </span>
                    <button 
                      onClick={copyReferralToClipboard}
                      className="text-slate-400 dark:text-gray-500 hover:text-white hover:scale-105 transition-all p-1"
                    >
                      {copiedCode ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  {copiedCode && (
                    <p className="text-[10px] text-emerald-400 text-right animate-pulse font-sans font-medium">
                      Copied full join Link to clipboard!
                    </p>
                  )}
                  <div className="pt-2 flex justify-between text-[11px] text-slate-450 dark:text-gray-400 border-t border-slate-800">
                    <span>Ambassador Level:</span>
                    <span className="font-semibold text-slate-200">Affiliate Link Partner</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-gray-500 italic font-sans text-center">
                  Error generating ambassador linkage in sandbox.
                </p>
              )}
            </div>

            {/* Claim Referral parent link Card */}
            {!loyaltyData?.inboundReferral ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 shadow-3xs">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wider font-sans flex items-center gap-1.5 uppercase border-b border-gray-200 dark:border-gray-700 pb-2">
                  <Users className="h-4.5 w-4.5 text-indigo-650" />
                  Claim Sponsor Link
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 font-sans leading-relaxed text-left">
                  Were you introduced by someone? Input their referral link code below to link profiles instantly.
                </p>
                <form onSubmit={handleClaimReferral} className="space-y-2">
                  <input
                    type="text"
                    value={sponsorCode}
                    onChange={(e) => setSponsorCode(e.target.value)}
                    required
                    placeholder="REF-XXXXXX"
                    className="w-full text-center font-mono font-bold uppercase tracking-wider text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={claimingReferral || !sponsorCode.trim()}
                    className="w-full bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs py-2 px-4 rounded-lg tracking-wider uppercase font-sans transition-colors flex justify-center items-center gap-1 shadow-xs"
                  >
                    {claimingReferral ? 'Securing Links...' : 'Claim Sponsor Connection'}
                    <PlusCircle className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-3 shadow-3xs text-left">
                <h3 className="text-xs font-bold text-gray-505 uppercase tracking-wider font-sans flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Referral Linked
                </h3>
                <p className="text-xs text-gray-650 font-sans leading-relaxed">
                  You joined under ambassador <span className="font-extrabold text-indigo-600">{loyaltyData.inboundReferral.referrerUserId?.name || 'Sponsor Code'}</span>. Enjoy active signup points privileges!
                </p>
              </div>
            )}

            {/* Outbound referrals status lists card */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4 shadow-3xs text-left">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wider font-sans flex items-center gap-1.5 uppercase border-b border-gray-200 dark:border-gray-700 pb-2">
                <Users className="h-4.5 w-4.5 text-indigo-650" />
                Referrals Converted
              </h3>
              
              {!loyaltyData || !loyaltyData.referrals || loyaltyData.referrals.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 italic font-sans text-center py-4">
                  No friends have converted under your unique code link yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 font-sans">
                  {loyaltyData.referrals.map((ref: any) => (
                    <div key={ref._id} className="border border-gray-150 dark:border-gray-700 rounded-lg p-2.5 bg-slate-50 dark:bg-gray-800 space-y-1.5 shadow-4xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[120px]">
                          {ref.referredUserId?.name || 'Invitee'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                          ref.status === 'PAID_REWARD_CLAIMED' 
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' 
                            : 'text-amber-700 bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                          {ref.status === 'PAID_REWARD_CLAIMED' ? 'CONVERTED' : 'JOINED'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-450 dark:text-gray-400 dark:text-gray-500">
                        <span>Invited on: {new Date(ref.createdAt).toLocaleDateString()}</span>
                        {ref.status === 'PAID_REWARD_CLAIMED' && (
                          <span className="text-indigo-600 font-bold font-mono">+100 XP Recipient</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
