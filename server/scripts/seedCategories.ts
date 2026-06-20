import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category.js';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

dotenv.config();

const categoriesData = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Explore premium consumer electronics, gadgets, smart devices, and high-tech gear for your digital life.',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Buy Premium Consumer Electronics & Smart Tech Online',
    seoDescription: 'Shop the latest gadgets, smart home appliances, and high-tech gear. Enjoy free shipping and premium warranty options.',
    isActive: true
  },
  {
    name: 'Mobile Phones',
    slug: 'mobile-phones',
    description: 'Discover flagship smartphones, standard mobile devices, and essential connectivity accessories.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Latest Smartphones & Flagship Mobile Phones Online',
    seoDescription: 'Browse top-rated mobile phones, folding smartphones, and budget-friendly devices with exclusive brand deals.',
    isActive: true
  },
  {
    name: 'Laptops',
    slug: 'laptops',
    description: 'Premium ultrabooks, powerful gaming rigs, and reliable business laptops designed for endless productivity.',
    image: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'High-Performance Laptops, Ultrabooks & Gaming Notebooks',
    seoDescription: 'Shop high-performance laptops for students, professionals, and gamers. Compare specs on the newest processors.',
    isActive: true
  },
  {
    name: 'Audio',
    slug: 'audio',
    description: 'Immerse yourself in crystal-clear sound with our reference-grade headphones, true wireless earbuds, and home theatre speakers.',
    image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Reference Audio Systems, Headphones & Wireless Earbuds',
    seoDescription: 'Experience premium acoustics. Shop high-fidelity noise-canceling headphones, smart soundbars, and audiophile speakers.',
    isActive: true
  },
  {
    name: 'Fashion Men',
    slug: 'fashion-men',
    description: 'Sophisticated menswear featuring tailored suits, casual street clothing, outerwear, and modern daily essentials.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
    seoTitle: "Designer Men's Fashion, Apparel & Essentials",
    seoDescription: 'Keep your wardrobe sharp with modern tailored apparel, casual sportswear, and high-fashion accessories for men.',
    isActive: true
  },
  {
    name: 'Fashion Women',
    slug: 'fashion-women',
    description: 'Elegant womenswear curated from modern designers, featuring dresses, versatile separates, coats, and luxury knitwear.',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    seoTitle: "Luxury Women's Fashion & Designer Clothing",
    seoDescription: "Explore the latest trends in women's apparel. From chic dresses to comfortable loungewear, lift your fashion sense.",
    isActive: true
  },
  {
    name: 'Footwear',
    slug: 'footwear',
    description: 'Step out in comfort with trainers, genuine leather boots, dynamic active footwear, and formal dress shoes.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Shop Athletic, Casual & Formal Footwear',
    seoDescription: 'Step with confidence. Discover durable hiking boots, breathable running sneakers, and handcrafted leather dress shoes.',
    isActive: true
  },
  {
    name: 'Home',
    slug: 'home',
    description: 'Transform your living spaces with elegant dynamic lighting, curated wall art, rich rugs, and cosy decor accents.',
    image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Mid-Century Modern Home Decor & Ambient Lighting',
    seoDescription: 'Curate an ambient living space. Browse handmade wall decor, accent pillows, and modern lighting elements.',
    isActive: true
  },
  {
    name: 'Kitchen',
    slug: 'kitchen',
    description: 'Upgrade your culinary creations with professional-grade cutlery, smart appliances, chef-grade cookware, and dining sets.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Professional Kitchen Appliances, Cutlery & Cookware',
    seoDescription: 'Shop durable chef-approved knives, non-stick culinary pots, and automated kitchen gadgets that simplify meal preparation.',
    isActive: true
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Ergonomic office chairs, solid hardwood tables, premium modular sofas, and durable beds built for premium relaxation.',
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Minimalist Wooden Furniture & Ergonomic Office Chairs',
    seoDescription: 'Invest in lifetime durability. Discover high-quality bedroom sets, solid dining tables, and flexible lounge seating.',
    isActive: true
  },
  {
    name: 'Fitness',
    slug: 'fitness',
    description: 'Achieve peak physical wellness with high-grade dumbbells, smart fitness trackers, yoga accessories, and home resistance gear.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Home Gym Equipment, Dumbbells & Fitness Accessories',
    seoDescription: 'Build your ultimate home gym with adjustable dumbbells, non-slip yoga mats, and premium physical wellness gear.',
    isActive: true
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Experience premium immersion with advanced mechanical keyboards, high-refresh monitors, current consoles, and desk chairs.',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Pro Gaming Peripherals, Console Gear & PC Accessories',
    seoDescription: 'Dominate the scoreboard with fast-switch mechanical keyboards, precision optical sensors, and ergonomic gaming furniture.',
    isActive: true
  },
  {
    name: 'Books',
    slug: 'books',
    description: 'Explore historical epics, modern philosophy, timeless literary classics, children\'s fables, and technical manuals.',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Bestselling Fiction, Non-Fiction & Textbook Volumes',
    seoDescription: 'Discover your next page-turner. Shop literary fiction masterworks, biography memoirs, self-growth guides, and research volumes.',
    isActive: true
  },
  {
    name: 'Beauty',
    slug: 'beauty',
    description: 'Treat your skin with organic serums, botanical cleansers, luxury cosmetics, and salon-quality haircare systems.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Organic Skincare, Serums & Premium Haircare Essentials',
    seoDescription: 'Elevate your beauty routine. Shop dermatologically tested sunscreen, dynamic skin serums, and mineral cosmetics.',
    isActive: true
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Complete your statement look with blue-light computer glasses, genuine leather wallets, smartwatches, and premium silk scarves.',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80',
    seoTitle: 'Premium Everyday Carry, Leather Wallets & Fine Jewelry',
    seoDescription: 'Standard extras that stand out. Browse RFID-blocking premium cardholders, timeless stainless steel wristwatches, and casual caps.',
    isActive: true
  }
];

export const seedCategories = async (shouldExit = true) => {
  try {
    if (!env.mongoUri || env.mongoUri === 'TO_BE_ADDED') {
      console.warn('MONGO_URI is missing or TO_BE_ADDED. Skipping seed.');
      if (shouldExit) process.exit(0);
      return;
    }

    await connectDB();
    console.log('Connected to Database. Starting Category Seeding...');

    // Delete existing categories first to prevent unique slug index violations
    const deletionResult = await Category.deleteMany({});
    console.log(`Deleted ${deletionResult.deletedCount} existing categories.`);

    const seededCategories = await Category.insertMany(categoriesData);
    console.log(`Successfully seeded ${seededCategories.length} categories!`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('Error during category seeding:', err);
    if (shouldExit) process.exit(1);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('seedCategories')) {
  seedCategories(true);
}
