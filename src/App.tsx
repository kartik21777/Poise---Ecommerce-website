/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './providers/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute, GuestRoute, AdminRoute, VendorRoute } from './routes/RouteGuards';
import { VendorLayout } from './components/layouts/VendorLayout';

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProducts = lazy(() => import('./pages/admin/Products').then(m => ({ default: m.Products })));
const ProductCreate = lazy(() => import('./pages/admin/ProductCreate').then(m => ({ default: m.ProductCreate })));
const ProductEdit = lazy(() => import('./pages/admin/ProductEdit').then(m => ({ default: m.ProductEdit })));
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ProductList = lazy(() => import('./pages/ProductList').then(m => ({ default: m.ProductList })));
const ProductDetail = lazy(() => import('./pages/ProductDetail').then(m => ({ default: m.ProductDetail })));
const CategoryPage = lazy(() => import('./pages/CategoryPage').then(m => ({ default: m.CategoryPage })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const WishlistPage = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.WishlistPage })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const MyOrders = lazy(() => import('./pages/MyOrders').then(m => ({ default: m.MyOrders })));
const OrderDetails = lazy(() => import('./pages/OrderDetails').then(m => ({ default: m.OrderDetails })));
const AdminOrders = lazy(() => import('./pages/admin/Orders').then(m => ({ default: m.Orders })));
const AdminPayments = lazy(() => import('./pages/admin/Payments').then(m => ({ default: m.AdminPayments })));
const AdminCommerce = lazy(() => import('./pages/admin/CurrencyManagement').then(m => ({ default: m.CurrencyManagement })));
const AdminGiftCards = lazy(() => import('./pages/admin/GiftCardManagement').then(m => ({ default: m.GiftCardManagement })));
const AdminMarketingAnalytics = lazy(() => import('./pages/admin/MarketingAnalytics').then(m => ({ default: m.MarketingAnalytics })));
const WalletDashboard = lazy(() => import('./pages/WalletDashboard').then(m => ({ default: m.WalletDashboard })));

const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorPayouts = lazy(() => import('./pages/vendor/VendorPayouts'));

const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Loader = () => <div className="min-h-screen flex items-center justify-center">Loading...</div>;

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<Loader />}>
                <Routes>
                  {/* Auth Routes (Guest Only) */}
                  <Route element={<GuestRoute />}>
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password/:token" element={<ResetPassword />} />
                    </Route>
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/products" element={<AdminProducts />} />
                      <Route path="/admin/products/new" element={<ProductCreate />} />
                      <Route path="/admin/products/:id/edit" element={<ProductEdit />} />
                      <Route path="/admin/orders" element={<AdminOrders />} />
                      <Route path="/admin/payments" element={<AdminPayments />} />
                      <Route path="/admin/commerce" element={<AdminCommerce />} />
                      <Route path="/admin/giftcards" element={<AdminGiftCards />} />
                      <Route path="/admin/analytics" element={<AdminMarketingAnalytics />} />
                    </Route>
                  </Route>

                  {/* Vendor Routes */}
                  <Route element={<VendorRoute />}>
                    <Route element={<VendorLayout />}>
                      <Route path="/vendor" element={<VendorDashboard />} />
                      <Route path="/vendor/products" element={<VendorProducts />} />
                      <Route path="/vendor/orders" element={<VendorOrders />} />
                      <Route path="/vendor/payouts" element={<VendorPayouts />} />
                    </Route>
                  </Route>

                  {/* Public verification */}
                  <Route path="/verify-email/:token" element={<MainLayout />} >
                    <Route index element={<VerifyEmail />} />
                  </Route>

                  {/* Main Shop Routes */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/products/:slug" element={<ProductDetail />} />
                    <Route path="/categories/:slug" element={<CategoryPage />} />
                    <Route path="/cart" element={<Cart />} />
                    
                    {/* Protected routes below */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/account" element={<div className="p-12 text-center">Account Details Coming Soon</div>} />
                      <Route path="/wallet" element={<WalletDashboard />} />
                      <Route path="/wishlist" element={<WishlistPage />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/orders" element={<MyOrders />} />
                      <Route path="/orders/:id" element={<OrderDetails />} />
                    </Route>

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
