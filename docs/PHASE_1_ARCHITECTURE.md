# Phase 1: System Architecture & Design Plan

## 1. System Architecture Overview
The application will follow a decoupling strategy optimized for scalability, using the MERN stack (MongoDB, Express, React, Node.js). 

**Frontend (Client-Side SPA):**
*   **Framework:** React 18+ with Vite for fast HMR and optimized builds.
*   **State Management:** React Context API for global state (Auth, Cart), local state via hooks.
*   **Routing:** React Router v6 for client-side navigation.
*   **Data Fetching:** Axios with interceptors for JWT injection and transparent refresh token rotation.
*   **Form Management:** React Hook Form integrated with Zod for strict client-side validation.
*   **Styling & Motion:** Tailwind CSS (configured exactly to the "Quiet Luxury" design system tokens), Framer Motion for stagger load and scroll animations.

**Backend (RESTful API):**
*   **Framework:** Node.js + Express.js.
*   **Architecture:** Layered architectural pattern (Routes → Controllers → Services → Models) to ensure absolute separation of business and transport logic.
*   **Database:** MongoDB Atlas via Mongoose ODM.
*   **File Uploads:** Multer for parsing multipart/form-data, streamed directly to Cloudinary.
*   **Payments:** Stripe Node.js SDK for PaymentIntents and Webhooks.

**Local Development vs. Production:**
*   *Local/Preview Environment:* Unified Express server that mounts Vite middleware (dev) or serves compiled static files (prod) on Port 3000 to comply with strict container port constraints.
*   *Production Deployment:* Separated deployments (Vercel + Render) connected via secure CORS configurations.

---

## 2. Folder Structure
```text
/
├── server/                 # Backend Node.js/Express application
│   ├── config/             # Environment, DB connection, Stripe config
│   ├── controllers/        # Request/Response handlers
│   ├── middleware/         # Auth (JWT), Error handler, Rate Limiter, Multer
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── services/           # Business logic and external API integrations
│   ├── utils/              # Helpers (Token generation, Cloudinary uploader)
│   └── server.ts           # Unified Express entry point
├── src/                    # Frontend React/Vite application
│   ├── assets/             # Static images, fonts, icons
│   ├── components/         # Reusable UI 
│   │   ├── common/         # Layouts, Navbar, Footer
│   │   ├── forms/          # Inputs, Form Groups
│   │   └── ui/             # Design system specific components (Bracket CTAs, Ivory Cards)
│   ├── context/            # React Contexts (Auth, Cart, UI)
│   ├── hooks/              # Custom hooks (useCart, useDebounce, useAnimation)
│   ├── pages/              # Route components (Home, Shop, Product, Admin)
│   ├── services/           # Axios API clients
│   ├── utils/              # Helpers (Formatting, Tailwind CN)
│   ├── App.tsx             # Main component / Route definitions
│   └── index.css           # Global CSS, Tailwind imports, Custom Fonts
├── docs/                   # Documentation and Architecture plans
├── .env.example            # Environment variables template
├── package.json            # Scripts & dependencies
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # 'Quiet luxury' token configuration
```

---

## 3. MongoDB Schema Plan
Schemas are optimized for fast reads and bounded document growth.

*   **User:**
    *   `firstName`, `lastName`, `email` (indexed), `password` (bcrypt), `role` (enum: user/admin), `isVerified`, `refreshTokens`.
*   **Address:**
    *   `user` (Ref), `street`, `city`, `state`, `zip`, `country`, `isDefault`. *(Separated from User to prevent unbounded array growth).*
*   **Category:**
    *   `name`, `slug` (indexed, unique), `image` (Cloudinary URL).
*   **Product:**
    *   `title`, `slug` (indexed, unique), `description`, `price`, `category` (Ref), `images` (Array), `variants` (Array of `{ sku, size, colorHex, stock }`), `tags` (Array of Strings), `isFeatured` (Boolean), `isActive` (Boolean), `salesCount` (Number), `ratingAvg`, `reviewCount`, `metaTitle` (String, optional), `metaDescription` (String, optional). 
    *   *Indexes:* Compound/Single indexes on `category`, `slug`, `tags`, `salesCount` (descending for best sellers), `createdAt` (descending for new arrivals), and `isFeatured`.
*   **RecentlyViewed:**
    *   `user` (Ref, indexed, unique), `history` (Array of `{ product: Ref, viewedAt: Date }`). 
    *   *Strategy:* Maintained at a max size (e.g., 20 items). When a new item is added, `$push` with `$slice` limitation is used to cap array size efficiently.
*   **Review:**
    *   `user` (Ref), `product` (Ref), `rating` (1-5), `comment`, `userImages` (Array, for Maison-24 style UGC gallery selfies). Compound Index on `{ user, product }` to prevent duplicate reviews.
*   **Cart:**
    *   `user` (Ref), `items` (Array of `{ productRef, variantId, quantity, priceAtAddition }`), `totalAmount`.
*   **Wishlist:**
    *   `user` (Ref), `products` (Array of product Refs).
*   **Order:**
    *   `user` (Ref, indexed), `items` (Array), `shippingAddress` (Ref), `subTotal`, `tax`, `shippingCost`, `total`, `stripePaymentIntentId`, `paymentStatus` (enum: pending, paid, failed, refunded), `orderStatus` (enum: pending, paid, processing, shipped, delivered, cancelled, refunded). 
    *   *Indexes:* Indexed on `user` and `orderStatus` for quick dashboard queries. 
*   **Coupon:**
    *   `code` (indexed, unique), `discountType` (percentage/fixed), `discountValue`, `expiryDate`, `usageLimit`, `usedCount`.

---

## 4. API Endpoint Plan & Strategies (RESTful)

**Authentication:** `/api/auth`
*   `POST /register` | `POST /login` | `POST /refresh` (Rotates JWT via HTTP-only cookie) | `POST /logout` | `POST /reset-password`

**Users:** `/api/users`
*   `GET /profile` | `PUT /profile` | `GET/POST/PUT/DELETE /addresses`
*   `GET /recently-viewed` (Retrieves user's recently viewed products)
*   `POST /recently-viewed/:productId` (Records a view, shifts history to enforce max size)

**Products & Discovery:** `/api/products`
*   `GET /` (Public - Includes Pagination, Sorting, Category/Tags/Price/Rating Filtering queries)
*   `GET /new-arrivals` (Public - Product list sorted by `createdAt:-1`)
*   `GET /best-sellers` (Public - Aggregates historical order data and relies on `salesCount:-1` index for speed)
*   `GET /featured` (Public - Queries active products where `isFeatured: true`)
*   `GET /:slug/related` (Public - Implements related strategy by scoring matches against the target's `category`, shared `tags`, and a price range similarity threshold bounding)
*   `GET /:slug` (Public)
*   `POST /`, `PUT /:id`, `DELETE /:id` (Admin Only - Includes SEO overrides: `metaTitle`, `metaDescription`)
*   `PATCH /:id/featured` (Admin Only - Toggle product `isFeatured` status)
*   `PATCH /:id/status` (Admin Only - Toggle `isActive` status)

**Categories:** `/api/categories`
*   `GET /` (Public) | `POST /`, `PUT /:id`, `DELETE /:id` (Admin Only)

**Cart & Wishlist:** `/api/cart` and `/api/wishlist`
*   `GET /`, `POST /item`, `PUT /item/:id`, `DELETE /item/:id`
*   `POST /merge` (Merges guest's `localStorage` cart with server cart upon login/register)

**Orders & Checkout:** `/api/orders` and `/api/checkout`
*   `POST /checkout/intent` (Generates Stripe Intent securely)
*   `POST /checkout/webhook` (Public - Stripe server-to-server Webhook handler)
*   `POST /orders/` (Create order post-payment)
*   `GET /orders/my-orders` | `GET /orders/:id`

**Reviews:** `/api/reviews`
*   `GET /product/:productId` (Public) | `POST /` (Protected)

**Admin:** `/api/admin`
*   `GET /dashboard` (Aggregated sales, revenue, and stock metric queries)
*   `PUT /orders/:id/status` (Admin transitions orders: pending -> paid -> processing -> shipped -> delivered, or cancelled/refunded)

---

## 5. Guest Cart & Authentication Journey

**Guest Cart Architecture & Storage:**
*   **Storage:** Cart structure (items, quantities, chosen variants including `sku`, `size`, `colorHex`, and `priceAtAddition`) is serialized and maintained in browser `localStorage` when no JWT is present.
*   **Operations:** All cart interactions (add, remove, change quantity) for guests mutate the `localStorage` object directly. The React Context abstracts this cleanly, exposing identical hooks for guest and auth states.

**Login Merge Strategy:**
When a guest registers or logs in, the authentication flow initiates a cart merge:
1.  **Retrieve:** Guest cart is read from `localStorage` and sent via an immediate subsequent `POST /api/cart/merge` call.
2.  **Combine & Resolve:** The backend retrieves the user's existing database cart and iterates over the incoming guest items.
3.  **Conflict Resolution:** If a product variant (matching `product` + `variantId` or `sku`) exists in both carts, the `quantity` is increased. Distinct items are appended. 
4.  **Preserve State:** Selected variants, sizes, colors and SKUs are preserved perfectly in the merged models.
5.  **Pricing Validation:** Prices for all merged items are re-verified against the source-of-truth current database product pricing to prevent client-side tampering.
6.  **Persist & Clear:** The merged cart is saved to MongoDB. The frontend receives the new unified cart and clears `localStorage`.

---

## 6. Security Strategy
*   **Authentication:** Short-lived access JWTs sent via memory/Authorization header. Long-lived refresh JWTs stored in secure, `httpOnly`, `Secure`, `SameSite=strict` cookies.
*   **Data Protection:** Passwords securely hashed via `bcrypt` with salt rounds = 12.
*   **XSS Protection:** Output encoding inherently managed in React. `helmet` middleware in Express to set secure HTTP headers (Content-Security-Policy, etc.).
*   **Injection Prevention:** Mongoose handles schema typing. `express-mongo-sanitize` implementation to strip out MongoDB operator injection ($/.). Extensive validation payload checks using `Zod` before controller processing.
*   **Rate Limiting:** `express-rate-limit` implemented globally (e.g., 100 req/15min) and sharply restricted on Auth endpoints (e.g., 5 req/15min for login failures).
*   **CORS Configuration:** Strictly configured to whitelist incoming requests only from the deployed Vercel frontend URL, excluding the open Stripe Webhook route handler.

---

## 7. Deployment Strategy & Performance Requirements
*   **Frontend (Vercel):**
    *   Vite build pipeline compiles static assets. React Router handles rapid client-side routing.
    *   Code-splitting applied on the Route level natively using `React.lazy` and Suspense boundaries.
*   **Backend (Render):**
    *   Node/Express REST API decoupled in production.
    *   Connection pooling configured for MongoDB Atlas to maintain scale/efficiency under load.
*   **Database (MongoDB Atlas):**
    *   Deployed in the identical cloud region as the Render backend instance to minimize geographical latency.
*   **Media Storage (Cloudinary):**
    *   Acts as an automated CDN for product and review images.
    *   Automatically handles format conversions (WebP/AVIF via `f_auto,q_auto`) and viewport-based resizing.

---

## 8. Branding, SEO & Metadata Strategy

**Brand Identity**
*   **Brand Name:** Poise
*   **Design Paradigm:** Quiet luxury, editorial aesthetic, refined minimalist e-commerce.

**SEO & Metadata**
*   **Global Title Tag Pattern:** `[Page Name] — Poise` (e.g., `Evening Wear — Poise`, `Checkout — Poise`).
*   **Homepage Title:** `Poise | Quiet Luxury E-Commerce`
*   **Meta Description:** "Discover Poise. A curated collection of highly refined, luxury silhouettes."
*   **Product Pages:** Dynamic SEO generation. Uses the product's explicitly defined `metaTitle` and `metaDescription` (configurable via Admin). If null/omitted, programmatically falls back to `Product Title` and truncated `Product Description`.
*   **Favicon/OpenGraph:** A clean, minimalist serif "P" set against a bone (`#FAF8F4`) background. Full Open Graph meta tag injection on canonical routes (og:title, og:description, og:image from Cloudinary API URL) leveraging the dynamic product SEO fields.

**UI Naming Conventions**
*   **Brand Logomark:** Rendered simply as "Poise" in `Cormorant Garamond` (Hero / Nav).
*   **Editorial Sections:** Instead of generic titles like "About Us" or "Featured", use editorial naming conventions like "The Poise Edit", "Discover Poise", or "The Story".
*   **Social Proof:** Use headers like "Worn with Poise" for community-submitted gallery reviews.
