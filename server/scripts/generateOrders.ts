import { connectDB } from '../config/db.js';
import { User, IUser } from '../models/User.js';
import { Product, IProduct } from '../models/Product.js';
import { Order, IOrderItem, IShippingAddressSnapshot, OrderStatus, PaymentStatus } from '../models/Order.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const STATUS_DISTRIBUTION = {
  DELIVERED: 0.60,
  SHIPPED: 0.15,
  PAID: 0.10,
  CANCELLED: 0.10,
  REFUNDED: 0.05
};

import { runAutoSeeding } from '../config/autoSeedRunner.js';

const getRandomStatus = (): OrderStatus => {
  const rand = Math.random();
  let cumulative = 0;
  for (const [status, probability] of Object.entries(STATUS_DISTRIBUTION)) {
    cumulative += probability;
    if (rand < cumulative) return status as OrderStatus;
  }
  return 'PENDING';
};

const getPaymentStatus = (orderStatus: OrderStatus): PaymentStatus => {
  if (orderStatus === 'REFUNDED') return 'REFUNDED';
  if (orderStatus === 'CANCELLED') return 'UNPAID';
  if (['PAID', 'SHIPPED', 'DELIVERED'].includes(orderStatus)) return 'PAID';
  return 'PENDING';
};

const generateOrderNumber = (index: number) => {
  return `ORD-${Date.now()}-${String(index).padStart(4, '0')}`;
};

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function generateOrders() {
  try {
    await connectDB();
    
    // Ensure database is seeded with users and products in the same context
    console.log('[Generation] Running auto-seeding to ensure context consistency...');
    await runAutoSeeding();

    const users = await User.find({ role: 'customer' });
    const products = await Product.find({ status: 'active' });

    if (users.length === 0 || products.length === 0) {
      console.error('No users or products found. Please seed them first.');
      process.exit(1);
    }

    const orders = [];
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(now.getFullYear() - 1);

    for (let i = 0; i < 500; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = getRandomStatus();
      const createdAt = getRandomDate(twelveMonthsAgo, now);
      
      // Random number of items (1-5)
      const numItems = Math.floor(Math.random() * 5) + 1;
      const orderItems: IOrderItem[] = [];
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const variant = product.variants[Math.floor(Math.random() * product.variants.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = variant.priceOverride || product.price;
        const lineTotal = unitPrice * quantity;

        orderItems.push({
          productId: product._id as mongoose.Types.ObjectId,
          productName: product.name,
          productSlug: product.slug,
          image: product.images[0]?.secure_url,
          sku: variant.sku,
          attributes: variant.attributes || [],
          quantity,
          unitPrice,
          lineTotal
        });

        subtotal += lineTotal;
      }

      const shipping = subtotal > 1000 ? 0 : 50;
      const tax = parseFloat((subtotal * 0.1).toFixed(2));
      const total = subtotal + shipping + tax;

      const shippingAddress: IShippingAddressSnapshot = {
        fullName: user.name,
        phone: user.phone || '+1-555-0199',
        addressLine1: user.address || '123 E-commerce Way',
        city: user.city || 'Tech City',
        state: 'CA', // Defaulting since user state might be missing
        postalCode: '90001',
        country: user.country || 'USA'
      };

      orders.push({
        user: user._id,
        orderNumber: generateOrderNumber(i),
        items: orderItems,
        shippingAddress,
        subtotal,
        shipping,
        tax,
        total,
        status,
        paymentStatus: getPaymentStatus(status),
        currency: 'USD',
        exchangeRateUsed: 1,
        source: 'WEB',
        createdAt,
        updatedAt: createdAt
      });
    }

    // Output JSON
    const outputPath = path.join(process.cwd(), 'orders_payload.json');
    fs.writeFileSync(outputPath, JSON.stringify(orders, null, 2));
    console.log(`JSON payload saved to ${outputPath}`);

    // Output MongoDB script
    const scriptPath = path.join(process.cwd(), 'seed_orders.js');
    const mongoScript = `
const orders = ${JSON.stringify(orders, null, 2)};
db.orders.insertMany(orders.map(o => ({
  ...o,
  user: ObjectId(o.user),
  items: o.items.map(i => ({ ...i, productId: ObjectId(i.productId) })),
  createdAt: new Date(o.createdAt),
  updatedAt: new Date(o.updatedAt)
})));
console.log('Seeded 500 orders successfully');
`;
    fs.writeFileSync(scriptPath, mongoScript);
    console.log(`MongoDB script saved to ${scriptPath}`);

    // Seed into DB
    const result = await Order.insertMany(orders);
    console.log(`Successfully seeded ${result.length} orders into the database.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

generateOrders();
