import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders.js';
import { ShoppingBag, Loader2, ClipboardList, Calendar, ExternalLink } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAYMENT_PENDING: 'bg-orange-50 text-orange-700 border-orange-200',
  PAID: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  SHIPPED: 'bg-purple-50 text-purple-700 border-purple-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-250',
  REFUNDED: 'bg-slate-100 text-slate-700 border-slate-300',
};

const payStatusColors: Record<string, string> = {
  UNPAID: 'text-rose-600 bg-rose-50 border-rose-100',
  PENDING: 'text-amber-600 bg-amber-50 border-amber-100',
  PAID: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  FAILED: 'text-gray-600 bg-gray-50 border-gray-100',
  REFUNDED: 'text-slate-600 bg-slate-50 border-slate-100',
};

export const MyOrders: React.FC = () => {
  const { data: orders, isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <p className="text-red-500 font-bold mb-2">Error Loading Orders</p>
        <p className="text-gray-600">Please try refreshing the page or logging back in if issues persist.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-5 mb-8">
          <ShoppingBag className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-950 tracking-tight">My Purchases</h1>
            <p className="text-sm text-gray-500 mt-1">Track history, download receipts, or check state transitions.</p>
          </div>
        </div>

        {(!orders || orders.length === 0) ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-12 text-center">
            <ClipboardList className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-gray-950 mb-2">No Orders Found</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't placed any purchases yet.</p>
            <Link
              to="/products"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 select-all">
                        {order.orderNumber}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-gray-50 border-gray-200'}`}>
                        {order.status}
                      </span>
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${payStatusColors[order.paymentStatus] || 'bg-gray-50'}`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>
                      <span>•</span>
                      <span>
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {/* Quick Preview of items */}
                    <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="h-10 w-10 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
                        >
                          {item.image ? (
                            <img src={item.image} alt={item.productName} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[10px] font-mono text-gray-400">SKU</span>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-gray-500 font-bold ml-1">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:text-right gap-4 md:flex-col shrink-0 border-t border-gray-100 pt-4 md:border-none md:pt-0">
                    <div>
                      <p className="text-xs text-gray-500">Grand Total</p>
                      <p className="text-2xl font-black text-gray-950 mt-0.5">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-sm border border-gray-200 rounded-lg transition-colors cursor-pointer"
                    >
                      View Details
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
