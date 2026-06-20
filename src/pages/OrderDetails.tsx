import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useOrders.js';
import { useCreatePaymentSession, usePaymentStatus } from '../hooks/usePayment.js';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Printer, Box, CheckCircle, Clock, CreditCard, AlertTriangle } from 'lucide-react';

const statusDisplay: Record<string, { label: string; bg: string; text: string; icon: any }> = {
  PENDING: { label: 'Pending Processing', bg: 'bg-amber-55 text-amber-900', text: 'text-amber-800', icon: Clock },
  PAYMENT_PENDING: { label: 'Awaiting Payment', bg: 'bg-orange-55 text-orange-900', text: 'text-orange-800', icon: Clock },
  PAID: { label: 'Paid & Confirmed', bg: 'bg-indigo-55 text-indigo-900', text: 'text-indigo-800', icon: CheckCircle },
  PROCESSING: { label: 'In Processing', bg: 'bg-blue-55 text-blue-900', text: 'text-blue-800', icon: Box },
  SHIPPED: { label: 'Shipped & En-Route', bg: 'bg-purple-55 text-purple-900', text: 'text-purple-800', icon: Box },
  DELIVERED: { label: 'Delivered', bg: 'bg-emerald-55 text-emerald-900', text: 'text-emerald-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-100 text-rose-900', text: 'text-rose-700', icon: Clock },
  REFUNDED: { label: 'Returned & Refunded', bg: 'bg-slate-200 text-slate-900', text: 'text-slate-700', icon: Clock },
};

const payStatusDisplay: Record<string, string> = {
  UNPAID: 'text-rose-600 font-bold bg-rose-50 border border-rose-105',
  PENDING: 'text-amber-600 font-bold bg-amber-50 border border-amber-105',
  PAID: 'text-emerald-600 font-bold bg-emerald-50 border border-emerald-105',
  FAILED: 'text-gray-500 font-medium bg-gray-50 border border-gray-150',
  REFUNDED: 'text-slate-600 font-medium bg-slate-50 border border-slate-150',
};

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isLoading, isError } = useOrder(id || '');

  // Enable reactive polling when the order is not paid to dynamically refresh the page on capture
  const isPollingActive = order?.paymentStatus !== 'PAID' && order?.status !== 'CANCELLED' && order?.status !== 'REFUNDED';
  const { data: transactions = [], isLoading: loadingTx } = usePaymentStatus(order?.id || '', isPollingActive);

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);

  const createSessionMutation = useCreatePaymentSession();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleExecutePayment = async () => {
    if (!order) return;
    setPaymentError(null);
    setIsInitiatingPayment(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load Razorpay SDK script. Please check your internet connection.');
      }

      const session = await createSessionMutation.mutateAsync({
        orderId: order.id,
        gateway: 'RAZORPAY',
      });

      const options = {
        key: session.razorpayKeyId,
        amount: Math.round(session.amount * 100),
        currency: session.currency || 'INR',
        name: 'E-Commerce Storefront',
        description: `Ref: ${order.orderNumber}`,
        order_id: session.gatewayOrderId,
        handler: async (response: any) => {
          console.log('[OrderDetails] Razorpay Payment authorized successfully:', response);
          // Invalidate React Query caches to trigger reactive polling instantly
          queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
          queryClient.invalidateQueries({ queryKey: ['payment-transactions', order.id] });
        },
        modal: {
          ondismiss: () => {
            console.log('[OrderDetails] Razorpay Checkout popup dismissed by client.');
          }
        },
        prefill: {
          name: order.shippingAddress.fullName || '',
          contact: order.shippingAddress.phone || '',
        },
        theme: {
          color: '#4f46e5'
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.open();
    } catch (err: any) {
      console.error('Razorpay process failed:', err);
      setPaymentError(err.response?.data?.message || err.message || 'Razorpay checkout launching failed.');
    } finally {
      setIsInitiatingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-red-500 font-bold mb-2">Order Not Found</p>
        <p className="text-gray-600 mb-6">We couldn't retrieve the details for this order. It may have been deleted, or does not belong to you.</p>
        <Link to="/orders" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg">
          Back to List
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const stateDetails = statusDisplay[order.status] || {
    label: order.status,
    bg: 'bg-gray-100 text-gray-800',
    text: 'text-gray-700',
    icon: Clock,
  };

  const payBadge = payStatusDisplay[order.paymentStatus] || 'bg-gray-50 text-gray-500';

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-5 mb-8 gap-4">
          <div>
            <Link to="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to My Purchases
            </Link>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-3xl font-black text-gray-950 tracking-tight">Purchase Detail</h1>
              <span className="font-mono text-sm text-indigo-600 select-all font-bold">{order.orderNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 h-10 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
          </div>
        </div>

        {/* Big Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            
            {/* Status Header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${stateDetails.bg} flex items-center justify-center shrink-0`}>
                  <stateDetails.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Processing Status</p>
                  <p className="text-lg font-extrabold text-gray-950 mt-0.5">{stateDetails.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 justify-between border-t border-gray-100 pt-4 md:border-none md:pt-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded uppercase mt-1 ${payBadge}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                <div className="text-right pl-4 border-l border-gray-100">
                  <p className="text-xs text-gray-500">Placed On</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{formattedDate}</p>
                </div>
              </div>
            </div>

            {/* Snapshot Items purchased */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6">
              <h2 className="text-lg font-black text-gray-955 mb-4">Ordered Items Snapshot</h2>
              <div className="flow-root divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-gray-50 border border-gray-150 rounded flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.productName} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xs font-mono text-gray-400">IMG</span>
                        )}
                      </div>
                      <div>
                        {item.productSlug ? (
                          <Link to={`/products/${item.productSlug}`} className="text-sm font-semibold text-gray-950 hover:text-indigo-600 transition-colors">
                            {item.productName}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-gray-955">{item.productName}</p>
                        )}
                        <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.sku}</p>
                        {item.attributes && item.attributes.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {item.attributes.map((attr, aIdx) => (
                              <span key={aIdx} className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                {attr.name}: {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between sm:text-right border-t border-gray-50 pt-2 sm:border-none sm:pt-0">
                      <div>
                        <p className="text-xs text-gray-500">Unit Price</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">${item.unitPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">x {item.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-sm font-black text-gray-950 mt-0.5">${item.lineTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar costs and addresses */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Delivery address */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6">
              <h2 className="text-lg font-extrabold text-gray-950 mb-4">Shipping Destination</h2>
              <div className="space-y-2">
                <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                <div className="text-sm text-gray-650 space-y-0.5">
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-wider">{order.shippingAddress.country}</p>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3 text-xs text-gray-500">
                  <span>Phone Number: </span>
                  <span className="font-semibold text-gray-800">{order.shippingAddress.phone}</span>
                </div>
              </div>
            </div>

            {/* Financial breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-gray-950 mb-1">Financial Receipt</h2>
              <div className="space-y-2.5 text-sm pb-4 border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cart Subtotal</span>
                  <span className="font-semibold text-gray-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Handling & Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {order.shipping === 0 ? <span className="text-emerald-600">Free</span> : `$${order.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estimated Tax</span>
                  <span className="font-semibold text-gray-900">${order.tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between text-base font-black text-gray-955 pt-1">
                <span>Total Amount Charged</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* SECTION 2 & 8: Interactive Payment Actions Section */}
            {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
              <div className="bg-white rounded-2xl border-2 border-indigo-150 shadow-sm p-6 space-y-4">
                <h3 className="text-sm font-black text-gray-950 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600 animate-pulse" />
                  Complete Your Payment
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Avoid inventory stock-outs by paying securely now. Products are only reserved upon dynamic, verified success webhook signals.
                </p>
                
                {paymentError && (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 p-3 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                    <span>{paymentError}</span>
                  </div>
                )}

                <button
                  onClick={handleExecutePayment}
                  disabled={isInitiatingPayment}
                  className="w-full flex items-center justify-center gap-2 h-11 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold text-sm rounded-lg shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed select-none"
                >
                  {isInitiatingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Connecting with gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      {order.paymentStatus === 'FAILED' ? 'Retry Payment (Razorpay)' : 'Pay Now with Razorpay'}
                    </>
                  )}
                </button>
              </div>
            )}

            {order.paymentStatus === 'PAID' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto animate-bounce" />
                <h3 className="text-sm font-black text-emerald-950">Payment Verified</h3>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your purchase is fully paid. Inventory has been securely reserved, and processing has commenced.
                </p>
              </div>
            )}

            {/* Payment Details Audit History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs p-6 space-y-4">
              <h2 className="text-lg font-extrabold text-gray-955 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Payment Record Details
              </h2>
              {loadingTx ? (
                <div className="text-xs text-gray-400 py-3 text-center flex items-center justify-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-xs text-gray-400 py-2 border-t border-gray-100">
                  No transaction logs discovered for this order. Payment attempt has not been recorded.
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-gray-100 pt-1">
                  {transactions.map((tx: any, idx: number) => (
                    <div key={tx._id} className={`text-xs ${idx > 0 ? 'pt-4' : ''}`}>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800">{tx.gateway} Gateway</span>
                        <span className={
                          tx.status === 'CAPTURED' ? 'text-emerald-600 font-extrabold text-mono' :
                          tx.status === 'FAILED' ? 'text-rose-600 font-extrabold text-mono' :
                          'text-amber-600 font-bold text-mono'
                        }>{tx.status}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono mt-1.5 break-all">
                        Transaction ID: <span className="font-semibold select-all text-gray-700">{tx.transactionId}</span>
                      </div>
                      {tx.gatewayOrderId && (
                        <div className="text-[11px] text-gray-500 font-mono mt-1">
                          Gateway Order ID: <span className="font-semibold select-all text-gray-700">{tx.gatewayOrderId}</span>
                        </div>
                      )}
                      {tx.failureReason && (
                        <div className="text-[11px] text-rose-600 font-medium mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                          Failure Reason: {tx.failureReason}
                        </div>
                      )}
                      <div className="text-[10px] text-gray-400 mt-2 flex justify-between">
                        <span>Attempt #{tx.attemptNumber || 1}</span>
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
