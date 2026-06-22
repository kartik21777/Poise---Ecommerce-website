import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.js';
import {
  CreditCard,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Info,
  RefreshCw,
  Eye,
  CornerUpLeft,
  Activity,
  ShieldAlert,
  ListFilter,
  FileSpreadsheet,
  AlertOctagon,
  TrendingDown,
  ArrowRight,
  Shield,
  RotateCcw,
  Check,
  Send,
  Sliders,
} from 'lucide-react';
import { GatewayAdminPanel } from '../../components/admin/GatewayAdminPanel.js';

interface PaymentOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
}

interface PaymentUser {
  name: string;
  email: string;
}

interface PaymentTransaction {
  _id: string;
  transactionId: string;
  order: PaymentOrder;
  user: PaymentUser;
  gateway: 'RAZORPAY' | 'STRIPE' | 'COD';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  amount: number;
  currency: string;
  status: string;
  attemptNumber: number;
  failureReason?: string;
  createdAt: string;
}

interface RefundTransaction {
  _id: string;
  refundId: string;
  order: PaymentOrder;
  paymentTransaction: {
    _id: string;
    transactionId: string;
    gatewayPaymentId?: string;
    amount: number;
    status: string;
  };
  gatewayRefundId?: string;
  amount: number;
  reason?: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface ReconciliationResult {
  orderNumber?: string;
  orderId?: string;
  transactionId?: string;
  gatewayPaymentId?: string;
  severity: 'MATCHED' | 'WARNING' | 'ERROR' | 'CRITICAL';
  type: string;
  message: string;
  recommendedAction: string;
}

interface WebhookEvent {
  _id: string;
  eventId: string;
  gateway: string;
  eventType: string;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED' | 'IGNORED';
  processedAt?: string;
  failureReason?: string;
  retryCount?: number;
  createdAt: string;
}

interface Dispute {
  _id: string;
  disputeId: string;
  order: PaymentOrder;
  paymentTransaction: PaymentTransaction;
  amount: number;
  currency: string;
  status: 'DISPUTE_OPENED' | 'EVIDENCE_REQUIRED' | 'UNDER_REVIEW' | 'WON' | 'LOST';
  reason?: string;
  evidenceDetails?: string;
  filedAt: string;
  resolvedAt?: string;
  createdAt: string;
}

export const AdminPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'refunds' | 'reconciliation' | 'exceptions' | 'disputes' | 'gateways'>('transactions');
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [refunds, setRefunds] = useState<RefundTransaction[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult[]>([]);
  const [exceptions, setExceptions] = useState<{
    failedWebhooks: WebhookEvent[];
    unprocessedStaleWebhooks: WebhookEvent[];
    deadLetters: WebhookEvent[];
  }>({ failedWebhooks: [], unprocessedStaleWebhooks: [], deadLetters: [] });
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtering and Searching values
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected inspect item states
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);

  // Refund dialog inputs state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundTargetTx, setRefundTargetTx] = useState<PaymentTransaction | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer Return / Request');
  const [refundCustomIdemp, setRefundCustomIdemp] = useState('');
  const [executingAction, setExecutingAction] = useState(false);

  // Dispute creation dialog inputs state
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeTargetTx, setDisputeTargetTx] = useState<PaymentTransaction | null>(null);
  const [disputeAmount, setDisputeAmount] = useState('');
  const [disputeReason, setDisputeReason] = useState('Unauthorized charge / Fraudulent');
  const [disputeStatus, setDisputeStatus] = useState<'DISPUTE_OPENED' | 'EVIDENCE_REQUIRED' | 'UNDER_REVIEW' | 'WON' | 'LOST'>('DISPUTE_OPENED');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  // Dispute modify tracker
  const [updatingDisputeId, setUpdatingDisputeId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/payments');
      setPayments(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load platform payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/payments/refunds');
      setRefunds(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to read Refund log registries');
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliation = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/payments/reconciliation?days=30');
      setReconciliation(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to execute payment reconciliation diagnostics');
    } finally {
      setLoading(false);
    }
  };

  const fetchExceptions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/payments/exceptions');
      setExceptions(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to collect payment exception metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get('/admin/payments/disputes');
      setDisputes(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to populate dispute logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');
    if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'refunds') {
      fetchRefunds();
    } else if (activeTab === 'reconciliation') {
      fetchReconciliation();
    } else if (activeTab === 'exceptions') {
      fetchExceptions();
    } else if (activeTab === 'disputes') {
      fetchDisputes();
    }
  }, [activeTab]);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTargetTx) return;
    setExecutingAction(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await apiClient.post(
        '/admin/payments/refund',
        {
          paymentTransactionId: refundTargetTx._id,
          amount: parseFloat(refundAmount),
          reason: refundReason,
          idempotencyKey: refundCustomIdemp || undefined,
        }
      );

      if (data.success) {
        setSuccess(`Refund Successful! Internal ID: ${data.refundId}`);
        setRefundModalOpen(false);
        setRefundAmount('');
        setRefundCustomIdemp('');
        fetchRefunds();
      } else {
        setError(`Refund Processing Status: ${data.status}. Message: ${data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred during refund processing.');
    } finally {
      setExecutingAction(false);
    }
  };

  const handleRetryRefund = async (refundId: string) => {
    setExecutingAction(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await apiClient.post(`/admin/payments/refunds/${refundId}/retry`, {});
      if (data.success) {
        setSuccess('Refund successfully retried and processed!');
        fetchRefunds();
      } else {
        setError(`Retry Refund status returned: ${data.status}. Reason: ${data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to retry refund execution.');
    } finally {
      setExecutingAction(false);
    }
  };

  const handleReprocessWebhook = async (eventId: string) => {
    setExecutingAction(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await apiClient.post('/admin/payments/webhooks/reprocess', { eventId });

      if (data.success) {
        setSuccess(`Webhook Event reprocessed successfully! Message: ${data.message}`);
        fetchExceptions();
      } else {
        setError(`Reprocess failed: ${data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Webhook reprocessing engine returned severe server exception.');
    } finally {
      setExecutingAction(false);
    }
  };

  const handleCreateOrUpdateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setExecutingAction(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        disputeId: updatingDisputeId || undefined,
        paymentTransactionId: disputeTargetTx?._id,
        orderId: disputeTargetTx?.order?._id,
        amount: parseFloat(disputeAmount),
        status: disputeStatus,
        reason: disputeReason,
        evidenceDetails: disputeEvidence,
      };

      await apiClient.post('/admin/payments/disputes', payload);
      setSuccess(updatingDisputeId ? 'Dispute record successfully updated.' : 'Dispute claim successfully logged.');
      setDisputeModalOpen(false);
      setUpdatingDisputeId(null);
      setDisputeAmount('');
      setDisputeEvidence('');
      fetchDisputes();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save Dispute logging metadata.');
    } finally {
      setExecutingAction(false);
    }
  };

  const openRefundInitiation = (tx: PaymentTransaction) => {
    setRefundTargetTx(tx);
    setRefundAmount(tx.amount.toString());
    setRefundReason('Merchant direct checkout cancel');
    setRefundCustomIdemp('');
    setRefundModalOpen(true);
  };

  const openDisputeInitiation = (tx: PaymentTransaction) => {
    setDisputeTargetTx(tx);
    setDisputeAmount(tx.amount.toString());
    setDisputeReason('Chargeback files received');
    setDisputeStatus('DISPUTE_OPENED');
    setDisputeEvidence('');
    setUpdatingDisputeId(null);
    setDisputeModalOpen(true);
  };

  const startEditDispute = (disp: Dispute) => {
    setUpdatingDisputeId(disp.disputeId);
    setDisputeAmount(disp.amount.toString());
    setDisputeReason(disp.reason || '');
    setDisputeStatus(disp.status);
    setDisputeEvidence(disp.evidenceDetails || '');
    setDisputeModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CAPTURED':
      case 'COMPLETED':
      case 'WON':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'LOST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
            <XCircle className="h-3 w-3 text-red-500" />
            {status}
          </span>
        );
      case 'PENDING':
      case 'CREATED':
      case 'AUTHORIZED':
      case 'PROCESSING':
      case 'REQUESTED':
      case 'DISPUTE_OPENED':
      case 'EVIDENCE_REQUIRED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <Clock className="h-3 w-3 text-amber-500" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-100">
            <Info className="h-3 w-3 text-slate-500" />
            {status}
          </span>
        );
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesStatus = statusFilter ? payment.status === statusFilter : true;
    const matchesGateway = gatewayFilter ? payment.gateway === gatewayFilter : true;
    const matchesSearch = searchQuery
      ? payment.order?.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (payment.gatewayPaymentId && payment.gatewayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return matchesStatus && matchesGateway && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-7 w-7 text-indigo-600 animate-pulse" />
            Financial & Payment Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Orchestrate business-level refunds, sync transaction ledgers, investigate payload delivery failures, and resolve disputed charges.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'transactions' && (
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Transactions
            </button>
          )}
          {activeTab === 'refunds' && (
            <button
              onClick={fetchRefunds}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Refunds
            </button>
          )}
          {activeTab === 'reconciliation' && (
            <button
              onClick={fetchReconciliation}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg shadow-xs hover:bg-indigo-100 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Run New Audit Sync
            </button>
          )}
          {activeTab === 'exceptions' && (
            <button
              onClick={fetchExceptions}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Query Stale Events
            </button>
          )}
          {activeTab === 'disputes' && (
            <button
              onClick={fetchDisputes}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload Disputes
            </button>
          )}
        </div>
      </div>

      {/* Global Toast Success and Error boxes */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Execution Error: </span>
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Action Completed: </span>
            {success}
          </div>
        </div>
      )}

      {/* Tabs list navigation (Desktop & Mobile) */}
      <div className="flex overflow-x-auto gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'transactions' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Transactions Registry
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'refunds' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CornerUpLeft className="h-4 w-4" />
          Refund Center
        </button>
        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'reconciliation' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Activity className="h-4 w-4" />
          Reconciliation Engine
        </button>
        <button
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'exceptions' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          Exceptions Hub
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'disputes' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          Claims & Disputes
        </button>
        <button
          onClick={() => {
            setActiveTab('gateways');
            setError('');
            setSuccess('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-all ${
            activeTab === 'gateways' ? 'bg-white text-indigo-650 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="h-4 w-4" />
          Gateways & Routing
        </button>
      </div>

      {/* Main Tab Panels */}
      {loading ? (
        <div className="h-80 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 font-medium mt-3 text-xs">Querying database endpoints under secure context...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: TRANSACTIONS REGISTRY */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Order, Tx ID, Email or Gateway ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-700 font-medium"
                  />
                </div>

                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-600 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="CREATED">CREATED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="AUTHORIZED">AUTHORIZED</option>
                    <option value="CAPTURED">CAPTURED</option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>

                <div>
                  <select
                    value={gatewayFilter}
                    onChange={(e) => setGatewayFilter(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all text-slate-600 font-semibold"
                  >
                    <option value="">All Gateways</option>
                    <option value="RAZORPAY">Razorpay</option>
                    <option value="STRIPE">Stripe</option>
                    <option value="COD">Cash on Delivery</option>
                  </select>
                </div>
              </div>

              {filteredPayments.length === 0 ? (
                <div className="p-12 bg-white border border-slate-200 text-center rounded-xl shadow-xs">
                  <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-sm">No recorded payments matched criteria.</p>
                  <p className="text-xs text-slate-400 mt-1">Refine your lookups or register a checkout attempt first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* List Table */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-4">Transaction / Order</th>
                            <th className="px-5 py-4">User</th>
                            <th className="px-5 py-4">Gateway</th>
                            <th className="px-5 py-4">Amount</th>
                            <th className="px-5 py-4">Status</th>
                            <th className="px-5 py-4 text-center">Inquire</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {filteredPayments.map((p) => (
                            <tr
                              key={p._id}
                              className={`hover:bg-slate-55/65 transition-colors cursor-pointer ${
                                selectedTx?._id === p._id ? 'bg-slate-50' : ''
                              }`}
                              onClick={() => setSelectedTx(p)}
                            >
                              <td className="px-5 py-4">
                                <div className="font-bold text-slate-800">{p.order?.orderNumber || 'N/A'}</div>
                                <div className="text-xs font-mono text-slate-400 truncate max-w-[120px]">{p.transactionId}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-slate-800">{p.user?.name || 'Guest'}</div>
                                <div className="text-[11px] text-slate-400">{p.user?.email || 'N/A'}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-750">
                                  {p.gateway}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">Attempt {p.attemptNumber}</div>
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-900">
                                ₹{p.amount.toLocaleString()}
                              </td>
                              <td className="px-5 py-4">{getStatusBadge(p.status)}</td>
                              <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedTx(p)}
                                  className="p-1 px-2.5 text-[10px] text-indigo-650 font-bold border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 rounded transition-colors"
                                >
                                  Inquire
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Details Sidebar Panel */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs h-fit space-y-5">
                    <div>
                      <h2 className="text-md font-bold text-slate-900">Attempt Deep Investigation</h2>
                      <p className="text-xs text-slate-400">Select a payment attempt row from the registry to execute administration triggers.</p>
                    </div>

                    {selectedTx ? (
                      <div className="space-y-4 text-xs divide-y divide-slate-100">
                        <div className="space-y-1.5 pb-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Status</div>
                          <div>{getStatusBadge(selectedTx.status)}</div>
                        </div>

                        <div className="space-y-1.5 py-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Checkout Session Signature</div>
                          <div className="font-mono text-xs bg-slate-50 p-2.5 rounded border border-slate-200 break-all select-all text-slate-620">
                            {selectedTx.transactionId}
                          </div>
                        </div>

                        <div className="space-y-1.5 py-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Order Numbers & Amounts</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Order ID</span>
                              <span className="font-bold text-slate-800">{selectedTx.order?.orderNumber}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Grand Total</span>
                              <span className="font-bold text-slate-900">₹{selectedTx.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 py-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Gateway References</div>
                          <div className="grid grid-cols-1 gap-1.5 text-[11px] font-mono bg-slate-50 p-2.5 rounded border border-slate-200 break-all">
                            <div>
                              <span className="text-slate-400 mr-2">Gateway Order:</span>
                              <span className="text-slate-700 font-semibold">{selectedTx.gatewayOrderId || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 mr-2">Gateway Payment:</span>
                              <span className="text-slate-700 font-semibold">{selectedTx.gatewayPaymentId || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 py-3">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Customer Card</div>
                          <div>
                            <span className="font-bold text-slate-800 block">{selectedTx.user?.name || 'Guest'}</span>
                            <span className="text-[11px] text-slate-400 block">{selectedTx.user?.email || 'N/A'}</span>
                          </div>
                        </div>

                        {selectedTx.status === 'FAILED' && selectedTx.failureReason && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 space-y-1 mt-4">
                            <span className="text-[10px] uppercase font-bold text-rose-500 block">Failure Reason</span>
                            <p className="text-[11px] leading-relaxed">{selectedTx.failureReason}</p>
                          </div>
                        )}

                        <div className="pt-4 space-y-2">
                          <div className="text-[10px] uppercase font-bold text-slate-400">Operator Triggers</div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              disabled={selectedTx.status !== 'CAPTURED'}
                              onClick={() => openRefundInitiation(selectedTx)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 hover:border-indigo-250 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <CornerUpLeft className="h-3 w-3" />
                              Refund
                            </button>
                            <button
                              disabled={selectedTx.status !== 'CAPTURED' && selectedTx.status !== 'FAILED'}
                              onClick={() => openDisputeInitiation(selectedTx)}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg border border-slate-200 hover:border-rose-250 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              File Dispute
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-10 text-center text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
                        <Info className="h-6 w-6 mx-auto mb-2 text-slate-350 animate-bounce" />
                        Select a payment listing on the left table to inspect identifiers and execute immediate business administration triggers.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REFUND CENTER */}
          {activeTab === 'refunds' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CornerUpLeft className="h-4 w-4 text-indigo-600" />
                  Refund Transactions Audit Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-1">Logs of all partial and cumulative customer refunds processed dynamically through gateway abstractions.</p>
              </div>

              {refunds.length === 0 ? (
                <div className="p-10 text-center">
                  <CornerUpLeft className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-sm">No Refund Transactions found.</p>
                  <p className="text-xs text-slate-400 mt-1">Refund requests are triggered by selecting a CAPTURED transaction in the transactions registry.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-5 py-4">Internal Refund ID</th>
                        <th className="px-5 py-4">Linked Order</th>
                        <th className="px-5 py-4">Orig. Capture ID (Gateway)</th>
                        <th className="px-5 py-4">Refund Amount</th>
                        <th className="px-5 py-4">Reason Statement</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Retry / Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {refunds.map((rf) => (
                        <tr key={rf._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">{rf.refundId}</span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">Gateway: {rf.gatewayRefundId || 'PENDING'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">{rf.order?.orderNumber || 'N/A'}</span>
                            <div className="text-[10px] text-slate-450 mt-0.5">Order Total: ₹{rf.order?.total?.toLocaleString()}</div>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-600">
                            <div>{rf.paymentTransaction?.transactionId || 'N/A'}</div>
                            <div className="text-[10px] text-slate-400">Gateway Ref: {rf.paymentTransaction?.gatewayPaymentId || 'N/A'}</div>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                            ₹{rf.amount.toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate" title={rf.reason}>
                            {rf.reason || 'No statement provided.'}
                          </td>
                          <td className="px-5 py-4">{getStatusBadge(rf.status)}</td>
                          <td className="px-5 py-4 text-right">
                            {rf.status === 'FAILED' ? (
                              <button
                                onClick={() => handleRetryRefund(rf._id)}
                                disabled={executingAction}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded transition-colors"
                              >
                                {executingAction ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Retry Execution
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECONCILIATION ENGINE */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-55 p-5 border border-indigo-150 rounded-xl flex items-start gap-4">
                <Shield className="h-8 w-8 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <h3 className="font-bold text-indigo-900 text-md">Platform-wide Reconciliation Audit Summary</h3>
                  <p className="text-indigo-750 font-medium leading-relaxed mt-1">
                    The reconciliation engine executes deep validation across three models simultaneously: **Orders**, **PaymentTransactions**, and **RefundTransactions**, matching local records with independent gateway states fetched on the fly.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-600 animate-pulse" />
                    Automated Discrepancy Findings
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Issues are cross-checked and classified here based on severity. Clear actions are provided to resolve each.</p>
                </div>

                {reconciliation.length === 0 ? (
                  <div className="p-10 text-center">
                    <Activity className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 font-bold text-sm">No Reconciliation traces generated yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Run New Audit Sync" at the top right to analyze the last 30 business days.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto font-sans">
                    <table className="min-w-full divide-y divide-slate-150 text-left">
                      <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-5 py-4">Linked Reference</th>
                          <th className="px-5 py-4">Severity Code</th>
                          <th className="px-5 py-4">Inconsistency Type</th>
                          <th className="px-5 py-4">Detailed Inconsistency Message</th>
                          <th className="px-5 py-4">Recommended Action Path</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {reconciliation.map((rc, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              {rc.orderNumber && (
                                <div className="font-bold text-slate-900">Order: {rc.orderNumber}</div>
                              )}
                              {rc.transactionId && (
                                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">Local Tx: {rc.transactionId}</div>
                              )}
                              {rc.gatewayPaymentId && (
                                <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">Gateway ID: {rc.gatewayPaymentId}</div>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                rc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-200' :
                                rc.severity === 'ERROR' ? 'bg-orange-100 text-orange-850 border border-orange-200' :
                                rc.severity === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-emerald-100 text-emerald-850 border border-emerald-200'
                              }`}>
                                {rc.severity}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-805">
                              {rc.type}
                            </td>
                            <td className="px-5 py-4 text-slate-600 max-w-[200px]">
                              {rc.message}
                            </td>
                            <td className="px-5 py-4 font-semibold text-indigo-750">
                              {rc.recommendedAction}
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

          {/* TAB 4: EXCEPTIONS HUB */}
          {activeTab === 'exceptions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Panel left: Failed Webhook Logs */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Failed Webhook Event Stream
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Webhook payloads where verification or execution crashed locally. Reprocessing triggers finalizers safely.</p>
                  </div>

                  {exceptions.failedWebhooks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No webhook exceptions discovered. Perfect delivery stream.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {exceptions.failedWebhooks.map((wh) => (
                        <div key={wh._id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-800">{wh.eventId}</span>
                            <span className="text-[10px] uppercase font-bold bg-slate-150 p-1 px-2 rounded">{wh.eventType}</span>
                          </div>
                          <div className="text-[11px] bg-red-50 text-red-800 p-2 border border-red-100 rounded leading-relaxed font-mono">
                            {wh.failureReason || 'Null stacktrace.'}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Retries: {wh.retryCount || 0} times</span>
                            <button
                              onClick={() => handleReprocessWebhook(wh._id)}
                              disabled={executingAction}
                              className="font-bold text-indigo-650 hover:text-indigo-800 underline disabled:opacity-50"
                            >
                              Reprocess Event
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Panel right: Dead Letters and Stale Events */}
                <div className="space-y-6">
                  {/* Dead letter section */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 text-rose-750">
                        <XCircle className="h-4 w-4 text-rose-500 animate-bounce" />
                        Dead-Letter Queue (DLQ)
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Webhooks that failed more than 3 consecutive retries. Requires manual settlement or intervention.</p>
                    </div>

                    {exceptions.deadLetters.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Dead letter queue is currently clean and resolved.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {exceptions.deadLetters.map((dl) => (
                          <div key={dl._id} className="p-4 space-y-1 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-800">{dl.eventId}</span>
                              <span className="text-[10px] font-bold text-red-650 font-sans">Retries Exceeded ({dl.retryCount})</span>
                            </div>
                            <p className="text-slate-500">{dl.failureReason || 'Exhausted state-execution retries.'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Stale Unprocessed sessions */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Stale Pending Webhooks
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Webhook packets received but stalled in RECEIVED status for over 30 minutes with no resolution.</p>
                    </div>

                    {exceptions.unprocessedStaleWebhooks.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No stale webhook sessions detected.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {exceptions.unprocessedStaleWebhooks.map((st) => (
                          <div key={st._id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                            <div>
                              <span className="font-mono font-semibold text-slate-850">{st.eventId}</span>
                              <p className="text-[10px] text-slate-400">Created: {new Date(st.createdAt).toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => handleReprocessWebhook(st._id)}
                              disabled={executingAction}
                              className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded font-bold hover:bg-indigo-100 transition-colors"
                            >
                              Incept
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: CLAIMS AND DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500 animate-pulse" />
                    Payment Dispute Claims Registry
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Tracking database for formal customer chargebacks, evidence reviews, and gateway win/loss records.</p>
                </div>
              </div>

              {disputes.length === 0 ? (
                <div className="p-10 text-center">
                  <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold text-sm">No Dispute records currently registered.</p>
                  <p className="text-xs text-slate-400 mt-1">To log a manual chargeback, trigger a "File Dispute" under a transaction from the main registry list.</p>
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="min-w-full divide-y divide-slate-150 text-left">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-widest">
                      <tr>
                        <th className="px-5 py-4">Internal Dispute ID</th>
                        <th className="px-5 py-4">Linked Order</th>
                        <th className="px-5 py-4">Financial Amount</th>
                        <th className="px-5 py-4">Filing Status</th>
                        <th className="px-5 py-4">Reason Statement</th>
                        <th className="px-5 py-4">Evidence & Attachment Details</th>
                        <th className="px-5 py-4 text-right">Modify Claim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {disputes.map((ds) => (
                        <tr key={ds._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4 font-bold text-slate-900">{ds.disputeId}</td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-800">{ds.order?.orderNumber || 'N/A'}</span>
                            <div className="text-[10px] text-slate-400 font-mono">Gateway Tx: {ds.paymentTransaction?.gatewayPaymentId || 'N/A'}</div>
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">₹{ds.amount.toLocaleString()}</td>
                          <td className="px-5 py-4">{getStatusBadge(ds.status)}</td>
                          <td className="px-5 py-4 text-slate-500 max-w-[150px] truncate">{ds.reason || 'Not filed.'}</td>
                          <td className="px-5 py-4 text-slate-600 max-w-[200px] font-medium leading-relaxed italic">{ds.evidenceDetails || 'No supporting evidence listed.'}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => startEditDispute(ds)}
                              className="px-2.5 py-1 font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 rounded transition"
                            >
                              Edit details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gateways' && (
            <GatewayAdminPanel />
          )}
        </>
      )}

      {/* MODAL 1: CREATE REFUND OVERLAY */}
      {refundModalOpen && refundTargetTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <CornerUpLeft className="h-5 w-5 text-indigo-650" />
                Initialize E-Commerce Refund
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-slate-450 hover:text-slate-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-400 block">Original captured transaction</label>
                <div className="font-mono text-xs bg-slate-50 p-2.5 border border-slate-150 rounded leading-normal">
                  <div className="text-slate-800 font-bold">Order: {refundTargetTx.order?.orderNumber}</div>
                  <div className="text-slate-500 mt-1">Tx: {refundTargetTx.transactionId}</div>
                  <div className="text-slate-500">Gateway Ref: {refundTargetTx.gatewayPaymentId || 'N/A'}</div>
                  <div className="text-indigo-650 font-bold mt-1">Max Refundable: ₹{refundTargetTx.amount}</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Refund Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={refundTargetTx.amount}
                  min="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Reason statement</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-705 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Custom Idempotency Key (Optional)</label>
                <input
                  type="text"
                  placeholder="Automated if left blank"
                  value={refundCustomIdemp}
                  onChange={(e) => setRefundCustomIdemp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-650"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executingAction}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50"
                >
                  {executingAction && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Confirm Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DISPUTE FILE / EDIT OVERLAY */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-650" />
                {updatingDisputeId ? `Modify Dispute Tracker ${updatingDisputeId}` : 'Log Formal Dispute Claim'}
              </h3>
              <button onClick={() => setDisputeModalOpen(false)} className="text-slate-450 hover:text-slate-700">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateDispute} className="p-5 space-y-4">
              {!updatingDisputeId && disputeTargetTx && (
                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-slate-400 block">Target captured row</label>
                  <div className="font-mono text-xs bg-slate-50 p-2.5 border border-slate-150 rounded text-slate-620">
                    <span className="font-bold text-slate-800">Order: {disputeTargetTx.order?.orderNumber}</span>
                    <div className="mt-1">Tx: {disputeTargetTx.transactionId}</div>
                    <div>Gateway ID: {disputeTargetTx.gatewayPaymentId || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Claim Dispute Amount (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  disabled={!!updatingDisputeId}
                  value={disputeAmount}
                  onChange={(e) => setDisputeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold text-slate-800 disabled:opacity-60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Filing status</label>
                <select
                  value={disputeStatus}
                  onChange={(e) => setDisputeStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 font-semibold text-slate-700"
                >
                  <option value="DISPUTE_OPENED">DISPUTE_OPENED</option>
                  <option value="EVIDENCE_REQUIRED">EVIDENCE_REQUIRED</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="WON">WON - Claim successfully defended</option>
                  <option value="LOST - Settlement deducted">LOST - Claim chargeback applied</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Reason statement</label>
                <input
                  type="text"
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-slate-705 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase font-bold text-slate-500 block">Supporting Evidence, docs & attachments</label>
                <textarea
                  rows={3}
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  placeholder="Paste chargeback ID, communications, shipping files, or delivery signatures here..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 leading-normal text-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executingAction}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
                >
                  {executingAction && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {updatingDisputeId ? 'Apply Update' : 'Log Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
