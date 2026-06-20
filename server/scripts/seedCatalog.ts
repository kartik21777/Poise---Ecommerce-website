import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

import { env } from '../config/env.js';

const seedCatalog = async () => {
  try {
    if (!env.mongoUri || env.mongoUri === 'TO_BE_ADDED') {
      console.warn('MONGO_URI is missing or TO_BE_ADDED. Skipping seed.');
      process.exit(0);
    }

    await connectDB();

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.warn('No admin found, creating a minimal one for ownership of seeded products...');
      admin = await User.create({
        name: 'Seed Admin',
        email: 'seed_' + Date.now() + '@example.com',
        role: 'admin',
        passwordHash: 'dummy',
        isEmailVerified: true
      });
    }

    console.log('Seeding Categories...');
    const catData = [
      { name: 'Electronics', slug: 'electronics', description: 'Gadgets and gear' },
      { name: 'Clothing', slug: 'clothing', description: 'Apparel' },
      { name: 'Home', slug: 'home', description: 'Home items' }
    ];

    const categories = [];
    for (const c of catData) {
      let created = await Category.findOne({ slug: c.slug });
      if (!created) {
        created = await Category.create(c);
      }
      categories.push(created);
    }

    console.log('Seeding Products...');
    const prodData = [
      {
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        description: 'High quality wireless headphones with noise cancellation.',
        category: categories[0]._id,
        price: 199.99,
        status: 'active' as const,
        isFeatured: true,
        images: [],
        tags: ['electronics', 'audio'],
        variants: [
          { sku: 'WH-01-BLK', attributes: [{ name: 'Color', value: 'Black' }], stock: 50, images: [] },
          { sku: 'WH-01-WHT', attributes: [{ name: 'Color', value: 'White' }], stock: 20, images: [] }
        ]
      },
      {
        name: 'Cotton T-Shirt',
        slug: 'cotton-t-shirt',
        description: '100% Cotton organic t-shirt.',
        category: categories[1]._id,
        price: 29.99,
        status: 'active' as const,
        isFeatured: false,
        images: [],
        tags: ['clothing', 'cotton'],
        variants: [
          { sku: 'TS-01-M', attributes: [{ name: 'Size', value: 'M' }], stock: 100, images: [] },
          { sku: 'TS-01-L', attributes: [{ name: 'Size', value: 'L' }], stock: 100, images: [] }
        ]
      }
    ];

    for (const p of prodData) {
      let created = await Product.findOne({ slug: p.slug });
      if (!created) {
        await Product.create({ ...p, createdBy: admin._id });
      } else {
        // Idempotent: don't duplicate
        console.log(`Product ${p.slug} already exists, skipping.`);
      }
    }

    console.log('Catalog seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedCatalog();
