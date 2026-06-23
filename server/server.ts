import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { createServer as createViteServer } from 'vite';

import { env, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { runAutoSeeding } from './config/autoSeedRunner.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import adminProductRoutes from './routes/adminProductRoutes.js';
import adminCurrencyRoutes from './routes/adminCurrencyRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import recentlyViewedRoutes from './routes/recentlyViewedRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminGiftCardRoutes from './routes/adminGiftCardRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import customerWalletRoutes from './routes/customerWalletRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import marketingRoutes from './routes/marketingRoutes.js';

async function startApp() {
  const app = express();
  const PORT = env.port as number;

  const missingSecrets = validateEnv();
  let isBackendReady = true;

  if (missingSecrets.length > 0) {
    if (env.nodeEnv === 'production' || env.nodeEnv === 'staging') {
      console.error(`CRITICAL ERROR: Environment variables missing: ${missingSecrets.join(', ')}`);
      process.exit(1);
    } else {
      console.warn(`WARNING: Running in Preview/Development mode without required secrets: ${missingSecrets.join(', ')}. Backend services disabled.`);
      isBackendReady = false;
    }
  }

  if (isBackendReady) {
    await connectDB();
    await runAutoSeeding();
  }

  // ── SECURITY & MIDDLEWARE ──────────────────────────────────────────────

  // Trust proxy for secure cookies behind reverse proxies (Render, Railway, Nginx, etc.)
  app.set('trust proxy', 1);

  // Global Rate Limiter
  const globalLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Increased for e-commerce browsing
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }, 
  });
  
  // Strict Auth Limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Strict limit for auth/login attempts
    message: { error: 'Too many authentication attempts, please try again later' },
  });

  // strict webhook limiter protecting against DDoS
  const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50, 
    message: { error: 'Webhook rate limit exceeded' },
  });

  app.use('/api', globalLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/api/v1/auth', authLimiter);
  app.use('/api/webhooks', webhookLimiter);
  app.use('/api/v1/webhooks', webhookLimiter);
  
  app.use(helmet({ 
    contentSecurityPolicy: env.nodeEnv === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://checkout.razorpay.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      }
    } : false,
    crossOriginEmbedderPolicy: false 
  }));
  
  app.use(cors({ 
    origin: env.clientUrl || '*', 
    credentials: true 
  }));
  
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
  app.use(compression());
  app.use(mongoSanitize());
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '10kb',
      verify: (req: any, res, buf) => {
        if (req.originalUrl && req.originalUrl.includes('/api/webhooks')) {
          req.rawBody = buf.toString();
        }
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── API ROUTES ─────────────────────────────────────────────────────────

  if (isBackendReady) {
    // Legacy mapping for backward compatibility
    app.use('/api/health', healthRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/admin/products', adminProductRoutes);
    app.use('/api/admin/commerce', adminCurrencyRoutes);
    app.use('/api/admin/giftcards', adminGiftCardRoutes);
    app.use('/api/admin/users', adminUserRoutes);
    app.use('/api/vendor', vendorRoutes);
    app.use('/api/wallet', customerWalletRoutes);
    app.use('/api/loyalty', loyaltyRoutes);
    app.use('/api/cart', cartRoutes);
    app.use('/api/wishlist', wishlistRoutes);
    app.use('/api/recently-viewed', recentlyViewedRoutes);
    app.use('/api/addresses', addressRoutes);
    app.use('/api', orderRoutes);
    app.use('/api', paymentRoutes);
    app.use('/api/marketing', marketingRoutes);

    // v1 mapping for version isolation
    const v1Router = express.Router();
    v1Router.use('/health', healthRoutes);
    v1Router.use('/auth', authRoutes);
    v1Router.use('/categories', categoryRoutes);
    v1Router.use('/products', productRoutes);
    v1Router.use('/admin/products', adminProductRoutes);
    v1Router.use('/admin/commerce', adminCurrencyRoutes);
    v1Router.use('/admin/giftcards', adminGiftCardRoutes);
    v1Router.use('/admin/users', adminUserRoutes);
    v1Router.use('/vendor', vendorRoutes);
    v1Router.use('/wallet', customerWalletRoutes);
    v1Router.use('/loyalty', loyaltyRoutes);
    v1Router.use('/cart', cartRoutes);
    v1Router.use('/wishlist', wishlistRoutes);
    v1Router.use('/recently-viewed', recentlyViewedRoutes);
    v1Router.use('/addresses', addressRoutes);
    v1Router.use(orderRoutes); // Order routes handle their own prefix, but wait: orderRoutes uses '/' and '/orders', so v1Router.use(orderRoutes) maps to /api/v1/orders etc.
    v1Router.use(paymentRoutes);
    v1Router.use('/marketing', marketingRoutes);

    app.use('/api/v1', v1Router);

    // ── ERROR HANDLING ───────────────────────────────────────────────────────
    
    app.use('/api/v1', notFound);
    app.use('/api', notFound);
    app.use(errorHandler);
  } else {
    // 503 for all API routes in preview mode
    app.use('/api', (req, res) => {
      res.status(503).json({ error: 'Backend API is disabled in Preview Mode due to missing environment variables.' });
    });
  }

  // ── VITE MIDDLEWARE / STATIC FILES ─────────────────────────────────────
  
  if (env.nodeEnv !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${PORT}`);
  });
}

startApp();
