import React, { useState } from 'react';
import { useAdminOrders } from '../../hooks/useOrders.js';
import {
  Loader2,
  Calendar,
  DollarSign,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Save,
  Check,
  CheckCircle2,
} from 'lucide-react';

const ORDER_STATUS_ENUMS = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUS_ENUMS = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];

const statusBgColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-250',
  PAYMENT_PENDING: 'bg-orange-150 text-orange-850 border-orange-250',
  PAID: 'bg-indigo-100 text-indigo-800 border-indigo-250',
  PROCESSING: 'bg-blue-100 text-blue-850 border-blue-250',
  SHIPPED: 'bg-purple-100 text-purple-850 border-purple-250',
  DELIVERED: 'bg-emerald-100 text-emerald-850 border-emerald-250',
  CANCELLED: 'bg-rose-100 text-rose-850 border-rose-250',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-300',
};

const payStatusBgColors: Record<string, string> = {
  UNPAID: 'text-rose-700 bg-rose-50 border-rose-200',
  PENDING: 'text-amber-700 bg-amber-50 border-amber-200',
  PAID: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  FAILED: 'text-gray-600 bg-gray-50 border-gray-200',
  REFUNDED: 'text-slate-600 bg-slate-50 border-slate-200',
};

// Check if status transition is allowed inside UI prior to request submission
const UI_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAYMENT_PENDING', 'PAID', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const canTransitTo = (from: string, to: string) => {
  if (from === to) return true;
  return UI_VALID_TRANSITIONS[from]?.includes(to) || false;
};

export const Orders: React.FC = () => {
  const { orders, isLoading, updateStatus, isUpdatingStatus } = useAdminOrders();
  const [activeOrderId, setActiveOrderId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Selected Order for transition mutations
  const activeOrder = orders.find(o => o.id === activeOrderId) || orders[0] || null;

  if (activeOrder && !activeOrderId) {
    setActiveOrderId(activeOrder.id);
  }

  // Handle Form changes for transitions
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPayStatus, setSelectedPayStatus] = useState<string>('');

  const handleSelectOrder = (id: string) => {
    setActiveOrderId(id);
    setSuccessMsg('');
    setErrorMsg('');
    const matched = orders.find(o => o.id === id);
    if (matched) {
      setSelectedStatus(matched.status);
      setSelectedPayStatus(matched.paymentStatus);
    }
  };

  React.useEffect(() => {
    if (activeOrder) {
      setSelectedStatus(activeOrder.status);
      setSelectedPayStatus(activeOrder.paymentStatus);
    }
  }, [activeOrder]);

  const handleUpdate = async () => {
    if (!activeOrder) return;
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateStatus({
        id: activeOrder.id,
        status: selectedStatus,
        paymentStatus: selectedPayStatus,
      });
      setSuccessMsg('Order statuses transitioned successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Error occurred during state modification.');
      // Re-sync correct state dropdown values
      setSelectedStatus(activeOrder.status);
      setSelectedPayStatus(activeOrder.paymentStatus);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading store orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review receipts, fulfill items, and transition state machines.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg shrink-0">
          <CheckCircle2 className="h-4 w-4" />
          <span>Fulfillment Engine Active</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs p-12 text-center max-w-xl mx-auto">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-lg font-bold text-gray-950 mb-2">No Registered Orders</h2>
          <p className="text-sm text-gray-500">When purchasers checkout items from their carts, sales orders will show up here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Order list column */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-bold text-gray-800">Sales Transactions ({orders.length})</h2>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {orders.map((o) => {
                const isSelected = activeOrderId === o.id;
                const formattedDate = new Date(o.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const totalItems = o.items.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <button
                    key={o.id}
                    onClick={() => handleSelectOrder(o.id)}
                    className={`w-full text-left p-4 transition-all flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 ${
                      isSelected ? 'bg-indigo-50/30 border-l-4 border-indigo-600 pl-3' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black text-indigo-600 uppercase select-all">{o.orderNumber.split('-')[2] ? `ORD-${o.orderNumber.split('-')[1]}...` : o.orderNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBgColors[o.status] || 'bg-gray-50 text-gray-700'}`}>
                          {o.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
                        <span className="truncate max-w-[120px] font-semibold text-gray-700">{(o as any).userContext?.name || 'Guest User'}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">${o.total.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{totalItems} items</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Order view column */}
          {activeOrder && (
            <div className="lg:col-span-7 space-y-6">
              
              {/* Controls and Transitions block */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-gray-950 flex items-center gap-1.5">
                    <Save className="h-5 w-5 text-indigo-600" />
                    Fulfillment State Actions
                  </h2>
                  <span className="font-mono text-xs text-gray-400 select-all">{activeOrder.orderNumber}</span>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-150">
                    <Check className="h-4 w-4 text-emerald-600 block shrink-0" />
                    {successMsg}
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2 border border-rose-200">
                    <ShieldAlert className="h-4 w-4 text-rose-600 block shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Transitions Form */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Order Tracking Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setSuccessMsg('');
                        setErrorMsg('');
                      }}
                      className="w-full text-sm font-semibold rounded-lg border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {ORDER_STATUS_ENUMS.map((s) => {
                        const isAllowed = s === activeOrder.status || canTransitTo(activeOrder.status, s);
                        return (
                          <option key={s} value={s} disabled={!isAllowed}>
                            {s} {s === activeOrder.status ? '(Current)' : !isAllowed ? '(Illegal Transition)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Payment Audit Status</label>
                    <select
                      value={selectedPayStatus}
                      onChange={(e) => {
                        setSelectedPayStatus(e.target.value);
                        setSuccessMsg('');
                        setErrorMsg('');
                      }}
                      className="w-full text-sm font-semibold rounded-lg border border-gray-300 bg-white p-2.5 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {PAYMENT_STATUS_ENUMS.map((ps) => (
                        <option key={ps} value={ps}>
                          {ps} {ps === activeOrder.paymentStatus ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdatingStatus || (selectedStatus === activeOrder.status && selectedPayStatus === activeOrder.paymentStatus)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Fulfilling Code...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Commit Transitions
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Order summary info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-6">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 pb-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Purchaser Context</p>
                    <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      {(activeOrder as any).userContext?.name} ({(activeOrder as any).userContext?.email})
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider text-right sm:text-right">Transaction Price</p>
                    <p className="text-2xl font-black text-gray-950">${activeOrder.total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Delivery details snapshot */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Shipping Destination</h3>
                  <div className="p-4 bg-slate-50 border border-slate-205 rounded-xl text-sm text-slate-800 space-y-1">
                    <p className="font-extrabold">{activeOrder.shippingAddress.fullName}</p>
                    <p>{activeOrder.shippingAddress.addressLine1}</p>
                    {activeOrder.shippingAddress.addressLine2 && <p>{activeOrder.shippingAddress.addressLine2}</p>}
                    <p>{activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.state} {activeOrder.shippingAddress.postalCode}</p>
                    <p className="font-mono text-xs text-slate-500 pt-1">Phone: {activeOrder.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Items snap list */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Itemized Snapshot (Immutable)</h3>
                  <div className="divide-y divide-gray-100">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 bg-gray-50 border border-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[10px] font-mono text-gray-400">SKU</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.productName}</p>
                            <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 leading-5">
                          <p className="font-bold text-gray-900">${item.lineTotal.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 font-medium">${item.unitPrice.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}
    </div>
  );
};
