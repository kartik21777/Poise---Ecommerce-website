import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../hooks/useCart.js';
import { useAddresses } from '../hooks/useAddresses.js';
import { useCheckoutPreview, useCreateOrder } from '../hooks/useOrders.js';
import { MapPin, Plus, Check, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart: cartData, isLoading: isCartLoading } = useCart();
  const { addresses, createAddress, isCreating } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  // Gift card and Wallet deduction states
  const [giftCardCode, setGiftCardCode] = useState('');
  const [appliedGiftCardCodes, setAppliedGiftCardCodes] = useState<string[]>([]);
  const [useStoreCredit, setUseStoreCredit] = useState(false);
  const [allocationPreview, setAllocationPreview] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponValue, setAppliedCouponValue] = useState('');

  // Address form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  // Load backend checkout preview values
  const activeAddressId = selectedAddressId || (addresses.find(a => a.isDefault)?.id || addresses[0]?.id || '');
  
  if (addresses.length > 0 && !selectedAddressId) {
    const def = addresses.find(a => a.isDefault)?.id || addresses[0]?.id;
    if (def) setSelectedAddressId(def);
  }

  const { data: calc, isLoading: isCalcLoading, error: calcError } = useCheckoutPreview(activeAddressId, appliedCouponValue);
  const createOrderMutation = useCreateOrder();

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAddress = await createAddress({
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        state,
        postalCode,
        country,
        isDefault: addresses.length === 0, // Make default if first address
      });
      setSelectedAddressId(newAddress.id);
      setIsAddingAddress(false);
      // Reset form
      setFullName('');
      setPhone('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPostalCode('');
    } catch (err) {
      console.error(err);
    }
  };

  // Live preview calculations for gift cards and store credit allocations (explicit conversions)
  React.useEffect(() => {
    const fetchAllocationsPreview = async () => {
      if (!calc?.total) {
        setAllocationPreview(null);
        return;
      }
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch('/api/wallet/preview-allocations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalAmount: calc.total,
            currency: calc.currency || 'USD',
            giftCardCodes: appliedGiftCardCodes,
            useStoreCredit,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setAllocationPreview(json.data);
        } else {
          setPreviewError(json.message);
        }
      } catch (err: any) {
        setPreviewError('Failed loading payment breakdown allocations.');
      } finally {
        setPreviewLoading(false);
      }
    };
    fetchAllocationsPreview();
  }, [calc?.total, calc?.currency, appliedGiftCardCodes, useStoreCredit]);

  const handleApplyGiftCard = (e: React.FormEvent) => {
    e.preventDefault();
    const code = giftCardCode.trim().toUpperCase();
    if (!code) return;
    if (appliedGiftCardCodes.includes(code)) {
      alert('This gift card code is already added to this order.');
      return;
    }
    setAppliedGiftCardCodes([...appliedGiftCardCodes, code]);
    setGiftCardCode('');
  };

  const handleRemoveGiftCardCode = (code: string) => {
    setAppliedGiftCardCodes(appliedGiftCardCodes.filter(c => c !== code));
  };

  const handlePlaceOrder = async () => {
    if (!activeAddressId) return;
    try {
      const order = await createOrderMutation.mutateAsync({
        shippingAddressId: activeAddressId,
        giftCardCodes: appliedGiftCardCodes,
        useStoreCredit,
        couponCode: appliedCouponValue || undefined,
      });
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      console.error(err);
    }
  };

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const itemsCount = cartData?.items?.length || 0;
  if (!cartData || itemsCount === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">Your Cart is Empty</h2>
        <p className="text-gray-600 mb-8">Add items to your cart before proceeding to checkout.</p>
        <Link to="/products" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-5 mb-8">
          <div>
            <Link to="/cart" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Cart
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Checkout</h1>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 rounded-lg p-2.5 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>Secure 256-bit SSL encrypted checkout</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Checkout Columns */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Step 1: Shipping Address Selection */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-950">Shipping Address</h2>
                </div>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="h-4 w-4" /> Add New Address
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {isAddingAddress ? (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateAddress}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="(555) 555-5555"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                      <input
                        type="text"
                        required
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="123 Main St"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                      <input
                        type="text"
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Apt, Suite, Unit, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                          type="text"
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingAddress(false)}
                        className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-1.5"
                      >
                        {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Address
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {addresses.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-250 rounded-xl bg-gray-50">
                        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium mb-1">No saved addresses found</p>
                        <p className="text-gray-500 text-sm mb-4">Set up a shipping address to estimate totals and check out.</p>
                        <button
                          onClick={() => setIsAddingAddress(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs"
                        >
                          Add Your First Address
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          return (
                            <button
                              type="button"
                              key={addr.id}
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`text-left p-4 rounded-xl border relative transition-all ${
                                isSelected
                                  ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/20'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mr-6">
                                <div>
                                  <p className="font-bold text-gray-900">{addr.fullName}</p>
                                  <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                                </div>
                                {isSelected && (
                                  <div className="h-5 w-5 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0">
                                    <Check className="h-3 w-3 block" />
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                                <p>{addr.addressLine1}</p>
                                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                <p className="text-gray-400 text-xs mt-1">{addr.country}</p>
                              </div>
                              {addr.isDefault && (
                                <span className="absolute bottom-3 right-3 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  Default
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2: Payment Preview */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-xl font-bold text-gray-950">Payment & Wallet Options</h2>
              </div>

              {/* Store Credit application toggle */}
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-start gap-3">
                <input
                  id="checkout-store-credit"
                  type="checkbox"
                  checked={useStoreCredit}
                  onChange={(e) => setUseStoreCredit(e.target.checked)}
                  className="h-4 w-4 mt-1 text-indigo-600 rounded border-gray-300"
                />
                <div className="text-left">
                  <label htmlFor="checkout-store-credit" className="font-bold text-gray-900 cursor-pointer">
                    Apply Available Store Credit Balance
                  </label>
                  <p className="text-xs text-gray-550 mt-0.5">
                    Toggling on will automatically apply any outstanding customer store credit holdings matching your account.
                  </p>
                </div>
              </div>

              {/* Promo Coupon application */}
              <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-3">
                <span className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400 block text-left">Coupon & Promo Discounts</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="ENTER CODE (e.g. SAVE15)"
                    className="flex-grow text-xs border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-600 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCouponValue(couponInput.trim().toUpperCase());
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {appliedCouponValue && (
                  <div className="flex justify-between items-center bg-emerald-50 text-emerald-850 px-2.5 py-1.5 rounded-lg text-xs border border-emerald-100">
                    <span className="font-semibold">Active Code: <strong className="font-mono text-emerald-950">{appliedCouponValue}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCouponValue('');
                        setCouponInput('');
                      }}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Gift card code addition */}
              <div className="p-4 border border-gray-200 rounded-xl bg-white space-y-3">
                <span className="text-xs font-bold font-sans uppercase tracking-wider text-gray-400 block text-left">Apply Gift Cards</span>
                <form onSubmit={handleApplyGiftCard} className="flex gap-2">
                  <input
                    type="text"
                    value={giftCardCode}
                    onChange={(e) => setGiftCardCode(e.target.value)}
                    placeholder="GC-XXXX-XXXX-XXXX"
                    className="flex-grow text-xs border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase tracking-wider focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-gray-900"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors"
                  >
                    Apply Card
                  </button>
                </form>

                {/* Applied Gift card list */}
                {appliedGiftCardCodes.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-dashed border-gray-150 text-left">
                    <p className="text-xs font-semibold text-gray-700">Applied Cards:</p>
                    {appliedGiftCardCodes.map((code) => (
                      <div key={code} className="flex justify-between items-center bg-gray-50 px-2.5 py-1 rounded text-xs border border-gray-100">
                        <span className="font-mono font-bold text-indigo-900">{code}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGiftCardCode(code)}
                          className="text-red-500 hover:text-red-700 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Gateway Notice */}
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-start gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-2.5 w-2.5 bg-indigo-600 rounded-full" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-950">Primary Credit Card Gateway / COD</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Any remaining balance not fully covered by your gift cards or store credit balances will be settled at delivery (COD) or pre-auth credit card.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Recalculated Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sticky top-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-950">Order Summary</h2>

              {/* Items List Snapshot */}
              <div className="flow-root divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
                {cartData.items.map((item: any) => {
                  const product = item.product;
                  const hasDetails = typeof product === 'object';
                  const title = hasDetails ? product.name : 'Product SKU: ' + item.variantSku;
                  const image = hasDetails && product.images?.[0]?.url;

                  return (
                    <div key={item.id} className="py-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                        {image ? (
                          <img src={image} alt={title} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-xs font-mono text-gray-400">IMG</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                        <p className="text-xs text-gray-500">
                          SKU: {item.variantSku} • Qty: {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warnings display */}
              {calc?.warnings && calc.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl space-y-1.5 text-xs">
                  <p className="font-bold flex items-center gap-1">
                    <HelpCircle className="h-4 w-4 shrink-0" /> Checkout Alerts
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {calc.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cost Calculations */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {isCalcLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `$${(calc?.subtotal ?? cartData.totalPrice).toFixed(2)}`}
                  </span>
                </div>
                {calc && (calc.promoDiscountAmount > 0 || calc.couponDiscountAmount > 0) && (
                  <div className="space-y-1.5 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-lg text-xs text-left">
                    {calc.promoDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-800 font-medium">
                        <span>Campaign Auto Promotion</span>
                        <span>-${calc.promoDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {calc.couponDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-800 font-medium">
                        <span>Applied Coupon Reward ({calc.appliedCouponCode})</span>
                        <span>-${calc.couponDiscountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-emerald-200 pt-1.5 flex justify-between font-bold text-emerald-950">
                      <span>Discounted Subtotal</span>
                      <span>${calc.discountedSubtotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {isCalcLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : calc?.shipping === 0 ? (
                      <span className="text-emerald-600">Free</span>
                    ) : (
                      `$${(calc?.shipping ?? 10).toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (8%)</span>
                  <span className="font-semibold text-gray-900">
                    {isCalcLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : `$${(calc?.tax ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span>
                    {isCalcLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      `$${(calc?.total ?? (cartData.totalPrice + 10)).toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Ledger-based snapshotted allocations preview breakdown */}
                {allocationPreview && (
                  <div className="border-t border-dashed border-gray-200 pt-3 space-y-2 text-xs">
                    {allocationPreview.allocatedGiftCard > 0 && (
                      <div className="flex justify-between text-purple-750 font-medium">
                        <span>Gift Card Allocation</span>
                        <span>-${allocationPreview.allocatedGiftCard.toFixed(2)}</span>
                      </div>
                    )}
                    {allocationPreview.allocatedStoreCredit > 0 && (
                      <div className="flex justify-between text-indigo-700 font-medium">
                        <span>Store Credit Allocation</span>
                        <span>-${allocationPreview.allocatedStoreCredit.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-extrabold text-slate-900">
                      <span>Gateway Balance Due</span>
                      <span>
                        ${allocationPreview.allocatedGateway.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Placement Trigger */}
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isCalcLoading || createOrderMutation.isPending || !activeAddressId}
                className="w-full h-12 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Processing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>

              {!activeAddressId && (
                <p className="text-center text-xs text-red-500 font-semibold mt-1">
                  Please configure or select a shipping address to proceed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
