import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';

dotenv.config();

interface IRawProductSpec {
  name: string;
  slugSuffix: string;
  categorySlug: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  description: string;
  tags: string[];
  imageUrls: string[];
  variantType: 'phones' | 'clothing' | 'general-colors' | 'laptops' | 'footwear' | 'books';
  pricingTier: 'budget' | 'mid-range' | 'premium';
}

const rawProducts: IRawProductSpec[] = [
  // --- Category: Electronics (7 items) ---
  {
    name: 'Smart Wi-Fi Plug Mini',
    slugSuffix: 'smart-wifi-plug-mini',
    categorySlug: 'electronics',
    brand: 'AmbianceTech',
    price: 19.99,
    compareAtPrice: 24.99,
    shortDescription: 'Control your home appliances wire-free from anywhere.',
    description: 'A compact smart plug that connects to your home Google Assistant or Alexa and allows remote voice/app scheduling.',
    tags: ['smart-home', 'home-automation', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: '4K TV Streaming Dongle',
    slugSuffix: '4k-tv-streaming-dongle',
    categorySlug: 'electronics',
    brand: 'StreamCast',
    price: 39.99,
    compareAtPrice: 49.99,
    shortDescription: 'Stream your favourite movies in stunning 4K ultra-high definition.',
    description: 'Experience lightning-fast streaming speeds and beautiful picture clarity. Includes voice remote and pre-loaded premium apps.',
    tags: ['streaming', 'television', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Robotic Vacuum Pro-Clean',
    slugSuffix: 'robotic-vacuum-pro-clean',
    categorySlug: 'electronics',
    brand: 'AutoSweep',
    price: 349.99,
    compareAtPrice: 399.99,
    shortDescription: 'Smart path planning robotic vacuum with automated mop.',
    description: 'Equipped with state-of-the-art LiDAR navigation, automated carpet detection sensors, and a smart scheduling app integration.',
    tags: ['smart-home', 'cleaning', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1518135839073-4e7153a3eab6?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Smart Thermostat Elite',
    slugSuffix: 'smart-thermostat-elite',
    categorySlug: 'electronics',
    brand: 'AmbianceTech',
    price: 149.99,
    compareAtPrice: 179.99,
    shortDescription: 'Optimize your home heating and cooling with AI energy tracking.',
    description: 'Learn your preferred temperature schedule and adjust environmental settings dynamically to save utility costs.',
    tags: ['smart-home', 'energy-saving', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Professional Mirrorless Camera',
    slugSuffix: 'professional-mirrorless-camera',
    categorySlug: 'electronics',
    brand: 'OptiPix',
    price: 1299.99,
    compareAtPrice: 1399.99,
    shortDescription: 'Capture high-speed professional-grade 4K videos and rich portraits.',
    description: 'Features a 24.2 MP full-frame sensor, ultra-sensitive autofocus tracking, weather-sealed construction, and in-body image stabilization.',
    tags: ['camera', 'photography', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Home Security Camera Twin-Pack',
    slugSuffix: 'home-security-camera-twin-pack',
    categorySlug: 'electronics',
    brand: 'GuardEye',
    price: 89.99,
    compareAtPrice: 109.99,
    shortDescription: 'Weather-resistant 1080p indoor/outdoor smart security bundle.',
    description: 'Keep your property safe with high-definition live streams, smart night vision infrared technology, and instant motion warnings.',
    tags: ['security', 'smart-home', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Smart LED Ambient Desk Light',
    slugSuffix: 'smart-led-ambient-desk-light',
    categorySlug: 'electronics',
    brand: 'AmbianceTech',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: 'Dimmable smart lamp with customizable ambient RGB colors.',
    description: 'Bring rich, pleasant lightning to your work desk. Fully controllable through physical touches, smart assistants, or custom mobile apps.',
    tags: ['lighting', 'smart-home', 'electronics'],
    imageUrls: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1550009158-9ebf6d250400?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },

  // --- Category: Mobile Phones (7 items) ---
  {
    name: 'VoltX Ultra Max Pro 5G',
    slugSuffix: 'voltx-ultra-max-pro-5g',
    categorySlug: 'mobile-phones',
    brand: 'VoltX',
    price: 999.99,
    compareAtPrice: 1099.99,
    shortDescription: 'Flagship speed, ultra-vibrant display, and groundbreaking camera zooms.',
    description: 'A revolutionary processor powers an dynamic AMOLED display, massive multi-day battery cell, and cinematic triple-lens setup.',
    tags: ['flagship', '5g', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'premium'
  },
  {
    name: 'Nova 9 Lite Smartphone',
    slugSuffix: 'nova-9-lite-smartphone',
    categorySlug: 'mobile-phones',
    brand: 'Nova',
    price: 199.99,
    compareAtPrice: 229.99,
    shortDescription: 'Everyday budget phone with solid performance and modern screen.',
    description: 'Enjoy high screen-to-body ratios, dependable quad-core processor speeds, and versatile daily cameras without breaking the bank.',
    tags: ['budget', 'affordable', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'budget'
  },
  {
    name: 'Horizon Flip Dual Screen',
    slugSuffix: 'horizon-flip-dual-screen',
    categorySlug: 'mobile-phones',
    brand: 'HorizonPhone',
    price: 849.99,
    compareAtPrice: 949.99,
    shortDescription: 'The compact folding smartphone designed for premium portability.',
    description: 'Folds flat to fit seamlessly in small pockets. Unfolds to present a massive organic LED screen of pristine color fidelity.',
    tags: ['folding', 'innovative', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'premium'
  },
  {
    name: 'Apex Pro Flagship Phone',
    slugSuffix: 'apex-pro-flagship-phone',
    categorySlug: 'mobile-phones',
    brand: 'ApexCorp',
    price: 649.99,
    compareAtPrice: 729.99,
    shortDescription: 'Premium performance, stunning night-mode lens, and durable frame.',
    description: 'Engineered with titanium reinforced sidebars, massive RAM allocations, and AI-assisted noise reduction for video captures.',
    tags: ['premium', 'flagship', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'mid-range'
  },
  {
    name: 'Core 5 Connect Smartphone',
    slugSuffix: 'core-5-connect-smartphone',
    categorySlug: 'mobile-phones',
    brand: 'Nova',
    price: 249.99,
    compareAtPrice: 279.99,
    shortDescription: 'Reliable dual-sim mobile phone featuring long-duration power.',
    description: 'Features a massive 6000mAh battery that guarantees constant connectivity even during off-grid travel. Durable plastic frame.',
    tags: ['battery', 'rugged', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1565630916779-e303be97b6f5?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'budget'
  },
  {
    name: 'Titan Military Rugged Phone',
    slugSuffix: 'titan-military-rugged-phone',
    categorySlug: 'mobile-phones',
    brand: 'VoltX',
    price: 429.99,
    compareAtPrice: 479.99,
    shortDescription: 'Heavy-duty rugged design waterproof, dustproof, shockproof.',
    description: 'Built specifically for construction workers and extreme outdoor enthusiasts. Thick rubber siding and scratch-resistant display glass.',
    tags: ['rugged', 'waterproof', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1574757527248-1084df1c2725?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'mid-range'
  },
  {
    name: 'Prism Fold Dual Display',
    slugSuffix: 'prism-fold-dual-display',
    categorySlug: 'mobile-phones',
    brand: 'HorizonPhone',
    price: 1399.99,
    compareAtPrice: 1499.99,
    shortDescription: 'The ultimate luxury productivity workstation folding phone.',
    description: 'Fuses double wide screens for simultaneous multithreading, advanced stylus writing support, and executive design patterns.',
    tags: ['phablet', 'premium', 'phones'],
    imageUrls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1601784551446-20c9e07cd8d3?auto=format&fit=crop&w=600&q=80'],
    variantType: 'phones',
    pricingTier: 'premium'
  },

  // --- Category: Laptops (7 items) ---
  {
    name: 'Spectre Thin Ultrabook 14',
    slugSuffix: 'spectre-thin-ultrabook-14',
    categorySlug: 'laptops',
    brand: 'SpectreTech',
    price: 1199.99,
    compareAtPrice: 1299.99,
    shortDescription: 'Chic featherlight laptop ideal for executives and remote workers.',
    description: 'Features a sleek aluminum unibody, long battery capacity, and a sharp pixel-dense screen for supreme visual processing.',
    tags: ['ultrabook', 'laptop', 'thin'],
    imageUrls: ['https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'premium'
  },
  {
    name: 'Zenith Gaming Laptop RTX',
    slugSuffix: 'zenith-gaming-laptop-rtx',
    categorySlug: 'laptops',
    brand: 'Zenith',
    price: 1599.99,
    compareAtPrice: 1799.99,
    shortDescription: 'Peak gaming power with high-end graphic cards and dual fans.',
    description: 'Unleash elite graphic renders with an advanced graphics card, rapid processing speeds, mechanical keyboard keypads, and vibrant lights.',
    tags: ['gaming', 'graphics', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'premium'
  },
  {
    name: 'Element Student Cloudbook 11',
    slugSuffix: 'element-student-cloudbook-11',
    categorySlug: 'laptops',
    brand: 'ApexCorp',
    price: 229.99,
    compareAtPrice: 249.99,
    shortDescription: 'Affordable, compact laptop centered on digital learning classes.',
    description: 'Perfect companion for essay writing and lecture stream watching. Lightweight plastic shell and anti-glare comfortable screens.',
    tags: ['student', 'budget', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'budget'
  },
  {
    name: 'ThinkFrame Business Pro 15',
    slugSuffix: 'thinkframe-business-pro-15',
    categorySlug: 'laptops',
    brand: 'SpectreTech',
    price: 899.99,
    compareAtPrice: 999.99,
    shortDescription: 'Industry-standard enterprise keyboard laptop with safety measures.',
    description: 'Equipped with fingerprint encryption keys, physical webcam block gates, multi-monitor display outputs, and dynamic speed boosts.',
    tags: ['business', 'security', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'mid-range'
  },
  {
    name: 'Aero Air Sleekbook 13',
    slugSuffix: 'aero-air-sleekbook-13',
    categorySlug: 'laptops',
    brand: 'ApexCorp',
    price: 749.99,
    compareAtPrice: 799.99,
    shortDescription: 'Whisper-quiet fanless business ultrabook with bright screen.',
    description: 'A completely silent design leveraging advanced chip technology, high density battery packs, and high visual contrast screens.',
    tags: ['silent', 'minimalist', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'mid-range'
  },
  {
    name: 'CreatorX Studio Expert 16',
    slugSuffix: 'creatorx-studio-expert-16',
    categorySlug: 'laptops',
    brand: 'Zenith',
    price: 1899.99,
    compareAtPrice: 1999.99,
    shortDescription: 'Color-calibrated screen notebook for music, design and 3D.',
    description: 'Precision colors mapped to absolute rendering accuracy. Huge flash storages allow instant load of digital asset libraries.',
    tags: ['designer', 'rendering', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'premium'
  },
  {
    name: 'Apex Developer Notebook 14',
    slugSuffix: 'apex-developer-notebook-14',
    categorySlug: 'laptops',
    brand: 'ApexCorp',
    price: 499.99,
    compareAtPrice: 549.99,
    shortDescription: 'Reliable entry programmer laptop with dual SSD expansion ports.',
    description: 'Optimized for local Docker containers and IDE performance. Durable plastic structure and comfortable typing keyboard layout.',
    tags: ['coding', 'linux-friendly', 'laptops'],
    imageUrls: ['https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80'],
    variantType: 'laptops',
    pricingTier: 'budget'
  },

  // --- Category: Audio (7 items) ---
  {
    name: 'SonicSilence Wireless Over-Ears',
    slugSuffix: 'sonicsilence-wireless-over-ears',
    categorySlug: 'audio',
    brand: 'SonicAcoustics',
    price: 199.99,
    compareAtPrice: 249.99,
    shortDescription: 'Reference-level active noise canceling headphone with long life.',
    description: 'Isolate ambient noise on planes and offices completely. Warm vocal curves and responsive clear treble output.',
    tags: ['anc', 'headphones', 'audio'],
    imageUrls: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'BeatBuds TWS Noise Purge',
    slugSuffix: 'beatbuds-tws-noise-purge',
    categorySlug: 'audio',
    brand: 'BeatAcoustics',
    price: 49.99,
    compareAtPrice: 59.99,
    shortDescription: 'True wireless sweatproof buds. Perfect for gym training.',
    description: 'Compact wireless case with fast charging. Snug internal fit guarantees buds stay secure during intense cardio runs.',
    tags: ['earbuds', 'workout', 'audio'],
    imageUrls: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'SoundBar Wave-300 Subwoofer',
    slugSuffix: 'soundbar-wave-300-subwoofer',
    categorySlug: 'audio',
    brand: 'SonicAcoustics',
    price: 179.99,
    compareAtPrice: 199.99,
    shortDescription: 'Cinematic theater audio console with separate active bass.',
    description: 'Fills the living room with acoustic immersion. Connects wirelessly to smart TVs and home media hubs.',
    tags: ['soundbar', 'home-theater', 'audio'],
    imageUrls: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'EchoCast Pocket Wireless Speaker',
    slugSuffix: 'echocast-pocket-wireless-speaker',
    categorySlug: 'audio',
    brand: 'BeatAcoustics',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: 'Waterproof miniature rugged speaker with convenient clip loop.',
    description: 'Small size delivers high punchy volume. Take audio to pool parties and forest camping site trips with confidence.',
    tags: ['speaker', 'portable', 'outdoor'],
    imageUrls: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'VocalPro Condenser Mic Pack',
    slugSuffix: 'vocalpro-condenser-mic-pack',
    categorySlug: 'audio',
    brand: 'VocalPro',
    price: 99.99,
    compareAtPrice: 129.99,
    shortDescription: 'Complete studio microphone bundle with desk boom and pop filter.',
    description: 'Crystal-clear audio captures for podcasts, commentary, gaming chats, or amateur bedroom vocal recordings.',
    tags: ['mic', 'recording', 'podcasting'],
    imageUrls: ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'StudioReference Studio Monitors',
    slugSuffix: 'studioreference-studio-monitors',
    categorySlug: 'audio',
    brand: 'SonicAcoustics',
    price: 129.99,
    compareAtPrice: 149.99,
    shortDescription: 'Flat-response studio monitors for home music mixing and mastering.',
    description: 'No boosted bass, just pristine high-fidelity audio accuracy. Features customizable acoustic room resonance balancing chips.',
    tags: ['monitors', 'flat-response', 'mixing'],
    imageUrls: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'SoundSphere Hi-Fi Floor Towers',
    slugSuffix: 'soundsphere-hi-fi-floor-towers',
    categorySlug: 'audio',
    brand: 'SonicAcoustics',
    price: 599.99,
    compareAtPrice: 699.99,
    shortDescription: 'Audiophile-grade multi-driver floor-standing cabinet speakers.',
    description: 'Handcrafted wooden design structures delivering pristine theater staging, realistic concert dynamics, and ultra-low bass frequencies.',
    tags: ['audiophile', 'speakers', 'audio'],
    imageUrls: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },

  // --- Category: Fashion Men (7 items) ---
  {
    name: 'Tailored Italian Wool Blazer',
    slugSuffix: 'tailored-italian-wool-blazer',
    categorySlug: 'fashion-men',
    brand: 'ModaUomo',
    price: 249.99,
    compareAtPrice: 299.99,
    shortDescription: 'Premium wool blend tailored jacket for formal events.',
    description: 'Crafted with premium soft breathability, comfortable satin internal lining, structured shoulders, and slim flattering lines.',
    tags: ['formal', 'blazer', 'wool'],
    imageUrls: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'premium'
  },
  {
    name: 'Organic Cotton Soft Tee',
    slugSuffix: 'organic-cotton-soft-tee',
    categorySlug: 'fashion-men',
    brand: 'DailyBasics',
    price: 19.99,
    compareAtPrice: 24.99,
    shortDescription: 'Subtle high-comfort cotton daily short sleeve t-shirt.',
    description: 'Sourced from organic fields, using non-toxic inks. Double stitched hems assure structural integrity after countless laundry washes.',
    tags: ['tees', 'basics', 'eco-friendly'],
    imageUrls: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },
  {
    name: 'Premium Slim-Fit Stretch Chinos',
    slugSuffix: 'premium-slim-fit-stretch-chinos',
    categorySlug: 'fashion-men',
    brand: 'ModaUomo',
    price: 59.99,
    compareAtPrice: 69.99,
    shortDescription: 'Flexible work-to-weekend trousers with hidden tech pockets.',
    description: 'Blends classic formal appearances with active comfort. Secure micro-zipper slots keep small items like keys safe.',
    tags: ['chinos', 'pants', 'business-casual'],
    imageUrls: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'mid-range'
  },
  {
    name: 'Heritage Vintage Denim Jacket',
    slugSuffix: 'heritage-vintage-denim-jacket',
    categorySlug: 'fashion-men',
    brand: 'RuggedWear',
    price: 89.99,
    compareAtPrice: 99.99,
    shortDescription: 'Classic indigo heavy wash trucker jacket with metal buttons.',
    description: 'Made from high-ounce rigid denim fabrics that break in beautifully over years of wear. Deep internal warm pockets.',
    tags: ['denim', 'jacket', 'vintage'],
    imageUrls: ['https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'mid-range'
  },
  {
    name: 'DryFit Athletics Workout Hoodie',
    slugSuffix: 'dryfit-athletics-workout-hoodie',
    categorySlug: 'fashion-men',
    brand: 'RuggedWear',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Moisture-wicking mesh hoodie suitable for cold track training.',
    description: 'Advanced knit structures insulate body heat while expelling moisture from the skin to assure post-workout comfort.',
    tags: ['athletics', 'sportswear', 'hoodie'],
    imageUrls: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },
  {
    name: 'Classic Oxford Dress Shirt',
    slugSuffix: 'classic-oxford-dress-shirt',
    categorySlug: 'fashion-men',
    brand: 'DailyBasics',
    price: 34.99,
    compareAtPrice: 39.99,
    shortDescription: 'Breathable, wrinkle-resistant classic button-down shirt.',
    description: 'Timeless collar looks sharp with tie combinations or casual open-necks. Double-ply combed cotton threads.',
    tags: ['formal', 'shirts', 'essentials'],
    imageUrls: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },
  {
    name: 'WeatherShield All-Weather Parka',
    slugSuffix: 'weathershield-all-weather-parka',
    categorySlug: 'fashion-men',
    brand: 'RuggedWear',
    price: 189.99,
    compareAtPrice: 219.99,
    shortDescription: 'Fleece insulated stormproof utility jacket with adjustable hood.',
    description: 'Engineered for bitter elements. Waterproof ratings withstand stormy rains while high loft internal down locks in body heat.',
    tags: ['parka', 'outerwear', 'winter-coat'],
    imageUrls: ['https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'premium'
  },

  // --- Category: Fashion Women (7 items) ---
  {
    name: 'Mulberry Silk Evening Wrap Dress',
    slugSuffix: 'mulberry-silk-evening-wrap-dress',
    categorySlug: 'fashion-women',
    brand: 'Soiree',
    price: 189.99,
    compareAtPrice: 220.00,
    shortDescription: '100% natural Mulberry silk evening flow dress.',
    description: 'Lustrous, lightweight, and incredibly smooth on skin. Drapes beautifully with flattering waist drawstrings.',
    tags: ['silk', 'dresses', 'evening-wear'],
    imageUrls: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'premium'
  },
  {
    name: 'UltraStretch Sculpting Leggings',
    slugSuffix: 'ultrastretch-sculpting-leggings',
    categorySlug: 'fashion-women',
    brand: 'ActiveCurve',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: 'Squat-proof wide high-waisted seamless training leggings.',
    description: 'Made from zero-glide nylon spans. Features convenient slip-in panels for carrying modern phones or locker keys.',
    tags: ['activewear', 'leggings', 'yoga'],
    imageUrls: ['https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },
  {
    name: 'Chunky Cashmere Knit Pullover',
    slugSuffix: 'chunky-cashmere-knit-pullover',
    categorySlug: 'fashion-women',
    brand: 'Soiree',
    price: 159.99,
    compareAtPrice: 179.99,
    shortDescription: 'Cozy cashmere ribbed-collar knit sweater in ivory white.',
    description: 'Supremely warm, non-itchy deluxe cashmere knit fibers. Timeless drop-shoulder slouchy cozy fit patterns.',
    tags: ['sweater', 'cashmere', 'knitwear'],
    imageUrls: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'premium'
  },
  {
    name: 'Classic Belted Paris Trench Coat',
    slugSuffix: 'classic-belted-paris-trench-coat',
    categorySlug: 'fashion-women',
    brand: 'AvenueStyle',
    price: 149.99,
    compareAtPrice: 169.99,
    shortDescription: 'Double-breasted sleek rainproof trench coat for autumn weather.',
    description: 'Classic tortoiseshell buttons, functional deep belt loops, storm flaps, and a structured collar layout.',
    tags: ['coat', 'trench', 'classic'],
    imageUrls: ['https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'mid-range'
  },
  {
    name: 'Linen Breeze Casual Summer Slip',
    slugSuffix: 'linen-breeze-casual-summer-slip',
    categorySlug: 'fashion-women',
    brand: 'AvenueStyle',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Breathable pre-washed pure European flax linen daily slip.',
    description: 'Keep cool on sunny beach resort strolls. Loose fit silhouette with adjustable shoulder ribbon laces.',
    tags: ['linen', 'summer-dress', 'slip'],
    imageUrls: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },
  {
    name: 'Sleek Workwear Straight Trousers',
    slugSuffix: 'sleek-workwear-straight-trousers',
    categorySlug: 'fashion-women',
    brand: 'AvenueStyle',
    price: 69.99,
    compareAtPrice: 79.99,
    shortDescription: 'High-waisted tailored crepe pants with deep utility slit pockets.',
    description: 'Perfect for modern business presentations. Easy-care stretch fabrics drape beautifully with executive loafers.',
    tags: ['trousers', 'workwear', 'pants'],
    imageUrls: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'mid-range'
  },
  {
    name: 'Everyday Ribbed Bodycon Minidress',
    slugSuffix: 'everyday-ribbed-bodycon-minidress',
    categorySlug: 'fashion-women',
    brand: 'ActiveCurve',
    price: 24.99,
    compareAtPrice: 29.99,
    shortDescription: 'Elastane-infused thick ribbed daily casual knitted minidress.',
    description: 'A versatile layer that transitions effortlessly from morning errands to nighttime dining when paired with clean jackets.',
    tags: ['minidress', 'bodycon', 'casual'],
    imageUrls: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'clothing',
    pricingTier: 'budget'
  },

  // --- Category: Footwear (7 items) ---
  {
    name: 'AeroPace Cushioned Road Sneakers',
    slugSuffix: 'aerospace-cushioned-road-sneakers',
    categorySlug: 'footwear',
    brand: 'AeroPace',
    price: 119.99,
    compareAtPrice: 139.99,
    shortDescription: 'Engineered responsive mesh daily training road running shoes.',
    description: 'High-density foam grids absorb strong concrete impactos while high traction outsoles prevent sliding on wet streets.',
    tags: ['running', 'trainers', 'footwear'],
    imageUrls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'mid-range'
  },
  {
    name: 'Craftsman Hand-stitched Leather Boots',
    slugSuffix: 'craftsman-hand-stitched-leather-boots',
    categorySlug: 'footwear',
    brand: 'Craftsman',
    price: 229.99,
    compareAtPrice: 260.00,
    shortDescription: 'Goodyear welted absolute grain calfskin heritage boots.',
    description: 'Built for lifetimes of reliable service. Fully support resole over time, aging into high visual luster character.',
    tags: ['boots', 'leather', 'premium-craft'],
    imageUrls: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'premium'
  },
  {
    name: 'CloudWalk Daily Cushioned Loafs',
    slugSuffix: 'cloudwalk-daily-cushioned-loafs',
    categorySlug: 'footwear',
    brand: 'CloudWalk',
    price: 45.00,
    compareAtPrice: 55.00,
    shortDescription: 'Soft slip-on everyday loafers with orthopedic foam inserts.',
    description: 'Zero pressure points, flexible stretch fabric shells, and machine-washable architectures for simple domestic maintenance.',
    tags: ['loafers', 'casual', 'slip-on'],
    imageUrls: ['https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'budget'
  },
  {
    name: 'PeakShield Heavy-Duty Hiking Boots',
    slugSuffix: 'peakshield-heavy-duty-hiking-boots',
    categorySlug: 'footwear',
    brand: 'Craftsman',
    price: 149.99,
    compareAtPrice: 169.99,
    shortDescription: 'Waterproof insulated hiking boots with high ankle guards.',
    description: 'Brave jagged mountains safely. Anti-torsion plates stabilize the foot across uneven rocks and muddy slopes.',
    tags: ['hiking-boots', 'waterproof', 'outdoor'],
    imageUrls: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'mid-range'
  },
  {
    name: 'AirStyle Street Retro High-Tops',
    slugSuffix: 'airstyle-street-retro-high-tops',
    categorySlug: 'footwear',
    brand: 'AeroPace',
    price: 85.00,
    compareAtPrice: 95.00,
    shortDescription: '80s classic basketball style casual skate board shoes.',
    description: 'Thick vintage rubber gums, breathable canvas lining, and premium synthetic leather panels for skater wear durability.',
    tags: ['high-tops', 'retro-sneakers', 'skate'],
    imageUrls: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'mid-range'
  },
  {
    name: 'Handcrafted Calfskin Dress Oxfords',
    slugSuffix: 'handcrafted-calfskin-dress-oxfords',
    categorySlug: 'footwear',
    brand: 'Craftsman',
    price: 189.99,
    compareAtPrice: 209.99,
    shortDescription: 'Sleek closed-lace Italian leather tuxedo business shoes.',
    description: 'Hand painted details project pristine visual depth. Perfect for weddings, corporate executives, or formal dinners.',
    tags: ['oxfords', 'formal-shoes', 'calfskin'],
    imageUrls: ['https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'premium'
  },
  {
    name: 'ComfortActive Daily Walking Foam',
    slugSuffix: 'comfortactive-daily-walking-foam',
    categorySlug: 'footwear',
    brand: 'CloudWalk',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Feather-light orthopedic running style walkers with laces.',
    description: 'Constructed around foot shape curves to relieve pressure during long standing retail shifts or warehouse tasks.',
    tags: ['walkers', 'comfortable', 'daily-shoes'],
    imageUrls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    variantType: 'footwear',
    pricingTier: 'budget'
  },

  // --- Category: Home (7 items) ---
  {
    name: 'Smart Halo Ambient Floor Lamp',
    slugSuffix: 'smart-halo-ambient-floor-lamp',
    categorySlug: 'home',
    brand: 'Lumiere',
    price: 119.99,
    compareAtPrice: 139.99,
    shortDescription: 'Minimalist metallic smart floor bar projecting dynamic colors.',
    description: 'Transform room vibes instantly. Set relaxing orange sun colors or rich cool ocean hues using smart schedules.',
    tags: ['lighting', 'modern-decor', 'lamp'],
    imageUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Modern Fluid Indigo Canvas Trio',
    slugSuffix: 'modern-fluid-indigo-canvas-trio',
    categorySlug: 'home',
    brand: 'Artisanal',
    price: 49.99,
    compareAtPrice: 59.99,
    shortDescription: '3-Piece matching abstract indigo blue gold framed prints.',
    description: 'Perfect accent piece to elevate empty office or bedroom walls. Textured canvas wraps look expensive and chic.',
    tags: ['wall-art', 'decor', 'framer'],
    imageUrls: ['https://images.unsplash.com/photo-1513511902900-a4d920928704?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Hand-Woven Merino Wool Rug',
    slugSuffix: 'hand-woven-merino-wool-rug',
    categorySlug: 'home',
    brand: 'Artisanal',
    price: 269.99,
    compareAtPrice: 299.99,
    shortDescription: 'Soft geometric high-pile natural un-dyed wool rug.',
    description: 'Handcrafted by expert weavers in flat weaving patterns. Extremely thick and insulating for cold timber floors.',
    tags: ['carpets', 'merino-wool', 'decor'],
    imageUrls: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Ultrasonic Oil Aromatherapy Diffuser',
    slugSuffix: 'ultrasonic-oil-aromatherapy-diffuser',
    categorySlug: 'home',
    brand: 'Lumiere',
    price: 24.99,
    compareAtPrice: 29.99,
    shortDescription: 'BPA-free dark stone aromatic mist generator with soft light.',
    description: 'Emits gentle cleansing steam infusing lavender smells throughout your bedroom. Quiet dynamic motor preserves sleep quality.',
    tags: ['wellness', 'aromatherapy', 'diffuser'],
    imageUrls: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Luxury Egyptian Cotton Sheet Set',
    slugSuffix: 'luxury-egyptian-cotton-sheet-set',
    categorySlug: 'home',
    brand: 'Lumiere',
    price: 45.00,
    compareAtPrice: 55.00,
    shortDescription: '600-Thread-count breathable cooling silk-touch bedsheet sheets.',
    description: 'Sleep in luxurious comfort. Deep mattress pocket fitting and double stitched premium seams secure sheets firmly.',
    tags: ['bedding', 'cotton', 'sheets'],
    imageUrls: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Thermal Blackout Grommet Curtains',
    slugSuffix: 'thermal-blackout-grommet-curtains',
    categorySlug: 'home',
    brand: 'Lumiere',
    price: 34.99,
    compareAtPrice: 39.99,
    shortDescription: 'Double-layered noise dampening complete blackout window curtains.',
    description: 'Blocks hot solar rays and prevents outside street traffic noises. Keeps energy bills low by insulating window panes.',
    tags: ['curtains', 'insulation', 'privacy'],
    imageUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Hand-Blown Swirl Glass Art Vase',
    slugSuffix: 'hand-blown-swirl-glass-art-vase',
    categorySlug: 'home',
    brand: 'Artisanal',
    price: 135.00,
    compareAtPrice: 155.00,
    shortDescription: 'Unique collectible heavy swirl patterned decorative glass vase.',
    description: 'A beautiful dining centerpiece that captures morning windows rays cleanly. Individually handcrafted by master artists.',
    tags: ['vase', 'luxury-art', 'handcrafted'],
    imageUrls: ['https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },

  // --- Category: Kitchen (7 items) ---
  {
    name: 'Professional Series Damascus Chef Knife',
    slugSuffix: 'professional-series-damascus-chef-knife',
    categorySlug: 'kitchen',
    brand: 'Kutler',
    price: 159.99,
    compareAtPrice: 179.99,
    shortDescription: '67-Layer Damascus steel core chef knife with ergonomic handle.',
    description: 'Incredible razor-sharp edge retention. Well-balanced handle provides fatigue-free chopping of dense root veggies or meat slabs.',
    tags: ['knives', 'chef-grade', 'cookware'],
    imageUrls: ['https://images.unsplash.com/photo-1593113630400-ea4288922497?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Barista Brew Precision Scales',
    slugSuffix: 'barista-brew-precision-scales',
    categorySlug: 'kitchen',
    brand: 'Kutler',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: '0.1g high accuracy kitchen spill-proof scales with timer.',
    description: 'Indispensable tool for measuring pour over coffee drips. Sleek matte black water-resistant panel cleans easily.',
    tags: ['scales', 'coffee', 'kitchen-gadget'],
    imageUrls: ['https://images.unsplash.com/photo-1517256064527-09c53b2d0ec6?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Non-Stick Copper Fry Pan Duo',
    slugSuffix: 'non-stick-copper-fry-pan-duo',
    categorySlug: 'kitchen',
    brand: 'Gastronomy',
    price: 89.99,
    compareAtPrice: 99.99,
    shortDescription: 'Super durable scratch-resistant ceramic copper frying pan set.',
    description: 'Cook zero-oil light eggs smoothly. Thick alloy core conducts heat with absolute uniformity on gas, induction, or electric ranges.',
    tags: ['cookware', 'pans', 'essential-kitchen'],
    imageUrls: ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'NutriSqueeze Personal Blender',
    slugSuffix: 'nutrisqueeze-personal-blender',
    categorySlug: 'kitchen',
    brand: 'Gastronomy',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Fast 900W bullet blender suitable for morning fruit smoothies.',
    description: 'Blends ice chunks and frozen fruits in under 15 seconds. Includes leakproof carry cups with lids for busy commuters.',
    tags: ['blender', 'smoothies', 'appliances'],
    imageUrls: ['https://images.unsplash.com/photo-1578643463396-0997cb5328c1?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Smart Control Gooseneck Drip Kettle',
    slugSuffix: 'smart-control-gooseneck-drip-kettle',
    categorySlug: 'kitchen',
    brand: 'Kutler',
    price: 119.99,
    compareAtPrice: 129.99,
    shortDescription: 'Matte black electric steel kettle with precise degree controls.',
    description: 'Pour controlled streams with an elegant gooseneck spot. Hold constant brewing heat for hours via local memory chips.',
    tags: ['kettle', 'pour-over', 'gadgets'],
    imageUrls: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Dual-Zone Air Fryer XL 9QT',
    slugSuffix: 'dual-zone-air-fryer-xl-9qt',
    categorySlug: 'kitchen',
    brand: 'Gastronomy',
    price: 159.99,
    compareAtPrice: 189.99,
    shortDescription: 'Cook two separate foods at different temperatures simultaneously.',
    description: 'Giant capacity accommodates whole roasted chicken effortlessly. Air circulation technology achieves crispy fry bites using 85% less oils.',
    tags: ['air-fryer', 'appliances', 'cooking-tech'],
    imageUrls: ['https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Craft Ceramic Stone Diningware Set',
    slugSuffix: 'craft-ceramic-stone-diningware-set',
    categorySlug: 'kitchen',
    brand: 'Gastronomy',
    price: 219.99,
    compareAtPrice: 249.99,
    shortDescription: '16-piece earthy matte raw edge dining sets for elegant tables.',
    description: 'Individually glazed stoneware plates that are dishwasher-safe and microwave friendly. Classic organic artisan textures.',
    tags: ['dinnerware', 'stoneware', 'luxury-dining'],
    imageUrls: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },

  // --- Category: Furniture (7 items) ---
  {
    name: 'ErgoPosture Active Mesh Office Seat',
    slugSuffix: 'ergoposture-active-mesh-office-seat',
    categorySlug: 'furniture',
    brand: 'ErgoBuild',
    price: 189.99,
    compareAtPrice: 219.99,
    shortDescription: 'Fully adjustable ergonomic desk chair protecting lumbar spines.',
    description: 'Features high tensile custom mesh backing, adaptive lumbar curve supporting sliders, 3D armrests, and premium fluid gas cylinders.',
    tags: ['office', 'chair', 'ergonomic'],
    imageUrls: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Rustic Solid Oak Living Room Table',
    slugSuffix: 'rustic-solid-oak-living-room-table',
    categorySlug: 'furniture',
    brand: 'HardwoodCo',
    price: 279.99,
    compareAtPrice: 310.00,
    shortDescription: 'Handcrafted raw edge solid oak coffee table with steel legs.',
    description: 'Exhibits robust grain lines protected by waterproofing organic sealants. Black iron legs provide modern industrial accent contrasts.',
    tags: ['table', 'coffee-table', 'hardwood'],
    imageUrls: ['https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Luxe Modular Suede Sectional Lounge',
    slugSuffix: 'luxe-modular-suede-sectional-lounge',
    categorySlug: 'furniture',
    brand: 'ComfortLuxe',
    price: 899.99,
    compareAtPrice: 999.99,
    shortDescription: 'Thick cushion modular sofa set that configures to any size.',
    description: 'Wrapped in spillproof pet-friendly dense suede. Heavy cloud padding foam retains shape elastic bounce over years.',
    tags: ['sofa', 'modular', 'living-room'],
    imageUrls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Industrial Steel Frame Floating Shelves',
    slugSuffix: 'industrial-steel-frame-floating-shelves',
    categorySlug: 'furniture',
    brand: 'HardwoodCo',
    price: 39.99,
    compareAtPrice: 49.99,
    shortDescription: 'Double tier durable raw pine floating wall shelves.',
    description: 'Organize plants, books, or bathroom cups cleanly. Heavy duty drywall anchor brackets make installations simple and secure.',
    tags: ['shelves', 'storage', 'home-office'],
    imageUrls: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Nordic Pine Queen Slat Bed',
    slugSuffix: 'nordic-pine-queen-slat-bed',
    categorySlug: 'furniture',
    brand: 'HardwoodCo',
    price: 349.99,
    compareAtPrice: 389.99,
    shortDescription: 'Minimalist platform timber bed frame needing no box springs.',
    description: 'Crafted from sustainable slow-grown scandinavian pine wood. Sleek tapered leg posts and dynamic woodgrain textures look stylish.',
    tags: ['bed', 'bedroom', 'scandinavian'],
    imageUrls: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Sleek Geometric Nightstand End Table',
    slugSuffix: 'sleek-geometric-nightstand-end-table',
    categorySlug: 'furniture',
    brand: 'ComfortLuxe',
    price: 69.99,
    compareAtPrice: 79.99,
    shortDescription: 'Dual storage nightstand with wireless cable charging docks.',
    description: 'Clean mid-century modern aesthetic featuring deep sliding drawer tracks and durable scratch-proof laminate finishes.',
    tags: ['nightstand', 'bedroom', 'furniture'],
    imageUrls: ['https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Tufted Velvet Storage Bedroom Ottoman',
    slugSuffix: 'tufted-velvet-storage-bedroom-ottoman',
    categorySlug: 'furniture',
    brand: 'ComfortLuxe',
    price: 49.99,
    compareAtPrice: 59.99,
    shortDescription: 'Soft velvet decorative bench containing hidden storage space.',
    description: 'Lift the plush foam lid to tuck blankets and winter jackets away. Brass trim ring accents add vintage classy feels.',
    tags: ['ottoman', 'bench', 'storage'],
    imageUrls: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },

  // --- Category: Fitness (6 items) ---
  {
    name: 'ProForce Adjustable Iron Dumbbell Set',
    slugSuffix: 'proforce-adjustable-iron-dumbbell-set',
    categorySlug: 'fitness',
    brand: 'ProForce',
    price: 199.99,
    compareAtPrice: 229.99,
    shortDescription: '25lbs adjustable fast twisting gym dumbbell single unit.',
    description: 'Replaces 5 heavy weight dumbbells instantly. Easily rotate the handle block dial to shift weight from 5lbs to 25lbs smoothly.',
    tags: ['dumbbells', 'home-workout', 'weightlifting'],
    imageUrls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'EcoStretch TPE Textured Yoga Mat',
    slugSuffix: 'ecostretch-tpe-textured-yoga-mat',
    categorySlug: 'fitness',
    brand: 'GymElite',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: '6mm dual layered anti-slip eco-friendly alignment yoga mat.',
    description: 'Perfect floor cushion thickness protects knee joints during complex holds. Reversible texture grip lines block sweat slides.',
    tags: ['yoga', 'mat', 'stretching'],
    imageUrls: ['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Heavy Duty Resistance Gym Band Set',
    slugSuffix: 'heavy-duty-resistance-gym-band-set',
    categorySlug: 'fitness',
    brand: 'GymElite',
    price: 19.99,
    compareAtPrice: 24.99,
    shortDescription: '5 stretch tubes with foam grips and heavy iron carabiners.',
    description: 'Perform full range resistance sweeps on muscles anywhere. Includes ankle attachments and travel packing bag.',
    tags: ['bands', 'resistance', 'portable-gym'],
    imageUrls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'ActiveHeart Fitness Tracker Band',
    slugSuffix: 'activeheart-fitness-tracker-band',
    categorySlug: 'fitness',
    brand: 'ProForce',
    price: 49.99,
    compareAtPrice: 59.99,
    shortDescription: 'Slim waterproof lifestyle tracker watch monitoring daily calories.',
    description: 'Record steps, active sleep parameters, and workout levels. Connect to your smartphone directly via secure local links.',
    tags: ['wearables', 'tracker', 'smartwatch'],
    imageUrls: ['https://images.unsplash.com/photo-1575311358312-6d15a0cd1f55?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'FlexRun Advanced Folding Treadmill',
    slugSuffix: 'flexrun-advanced-folding-treadmill',
    categorySlug: 'fitness',
    brand: 'GymElite',
    price: 649.99,
    compareAtPrice: 699.99,
    shortDescription: 'Quiet motor running desk treadmill with smart phone stands.',
    description: 'Fold flat smoothly to slide under beds when storing. Shock absorbs track layers reduce knee strike impacts by 30%.',
    tags: ['treadmill', 'cardio', 'home-workout'],
    imageUrls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'TargetCore Steel Wheel Ab Roller',
    slugSuffix: 'targetcore-steel-wheel-ab-roller',
    categorySlug: 'fitness',
    brand: 'ProForce',
    price: 15.99,
    compareAtPrice: 19.99,
    shortDescription: 'Extra steady wide tread ab roller with comfortable knee pad.',
    description: 'Target compound core muscles safely. Heavy duty internal steel rod supports up to 350 lbs of raw weight pressure.',
    tags: ['ab-roller', 'core', 'workout'],
    imageUrls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },

  // --- Category: Gaming (6 items) ---
  {
    name: 'ApexPro Mechanical Red Switch Keyboard',
    slugSuffix: 'apexpro-mechanical-red-switch-keyboard',
    categorySlug: 'gaming',
    brand: 'ApexGaming',
    price: 89.99,
    compareAtPrice: 99.99,
    shortDescription: 'Compact tenkeyless fast red switch gaming gaming keyboard.',
    description: 'Silent fast linear keys provide immediate millisecond responses during intense matches. Vivid addressable base lights.',
    tags: ['keyboard', 'rgb', 'mechanical'],
    imageUrls: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'PrecisionSniper 16000DPI Gaming Mouse',
    slugSuffix: 'precisionsniper-16000dpi-gaming-mouse',
    categorySlug: 'gaming',
    brand: 'FuryCore',
    price: 34.99,
    compareAtPrice: 39.99,
    shortDescription: 'Ultra feather-light honeycomb wireless gaming mouse.',
    description: 'Weighs only 58g for blistering cross-hair flicks. High fidelity optical tracking sensor prevents tracking drops.',
    tags: ['mouse', 'fps', 'gaming'],
    imageUrls: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'ErgoRacer Racing Style Gaming Chair',
    slugSuffix: 'ergoracer-racing-style-gaming-chair',
    categorySlug: 'gaming',
    brand: 'ApexGaming',
    price: 229.99,
    compareAtPrice: 259.99,
    shortDescription: 'Reclining high back lumbar bolster desk gaming chair.',
    description: 'Wrapped in durable leather trim with memory foam support cushions. Lay flat back tilt provides cozy breaks between games.',
    tags: ['chair', 'gaming-furniture', 'comfort'],
    imageUrls: ['https://images.unsplash.com/photo-1598550476439-6847785fce6e?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'Quantum 34-Inch Curved Gaming Monitor',
    slugSuffix: 'quantum-34-inch-curved-gaming-monitor',
    categorySlug: 'gaming',
    brand: 'FuryCore',
    price: 449.99,
    compareAtPrice: 499.99,
    shortDescription: 'Wide cinematic curved ultra QHD screen running at fast 144Hz.',
    description: 'Complete immersion into battle scenes. High rate screens eradicate screen tearing for beautifully fluid gameplay tracks.',
    tags: ['monitor', 'curved', 'ultrawide'],
    imageUrls: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },
  {
    name: 'BattleVoice Pro Wireless Game Headset',
    slugSuffix: 'battlevoice-pro-wireless-game-headset',
    categorySlug: 'gaming',
    brand: 'FuryCore',
    price: 79.99,
    compareAtPrice: 89.99,
    shortDescription: 'Low latency spatial surround sound audio gaming microphone headset.',
    description: 'Detachable clear microphone isolation guarantees your tactical commands are received clearly by guild members.',
    tags: ['headset', 'audio', 'wireless-gaming'],
    imageUrls: ['https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Vortex Elite Bluetooth Controller',
    slugSuffix: 'vortex-elite-bluetooth-controller',
    categorySlug: 'gaming',
    brand: 'ApexGaming',
    price: 59.99,
    compareAtPrice: 69.99,
    shortDescription: 'Responsive textured grip console controller with back paddles.',
    description: 'Remap trigger buttons to professional layout triggers. High battery cell allows 30 hours of wireless gaming.',
    tags: ['controller', 'gamepad', 'accessories'],
    imageUrls: ['https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },

  // --- Category: Books (6 items) ---
  {
    name: 'Shadows of Destiny Novel',
    slugSuffix: 'shadows-of-destiny-novel',
    categorySlug: 'books',
    brand: 'ChroniclePublishing',
    price: 14.99,
    compareAtPrice: 19.99,
    shortDescription: 'An immersive science fiction paperback epic covering centuries.',
    description: 'A thrilling mystery unfolds in a distant space solar system where a brilliant programmer must decode cyber ancient ruins.',
    tags: ['sci-fi', 'fiction', 'paperback'],
    imageUrls: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'budget'
  },
  {
    name: 'The Code Catalyst Tech Essay',
    slugSuffix: 'the-code-catalyst-tech-essay',
    categorySlug: 'books',
    brand: 'Syntactix',
    price: 24.99,
    compareAtPrice: 29.99,
    shortDescription: 'A modern breakdown of standard software development over years.',
    description: 'Explores how small open source repositories scaled into crucial components of international cloud communications platforms.',
    tags: ['technology', 'non-fiction', 'educational'],
    imageUrls: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'budget'
  },
  {
    name: 'Echoes of Modern Philosophy Book',
    slugSuffix: 'echoes-of-modern-philosophy-book',
    categorySlug: 'books',
    brand: 'ChroniclePublishing',
    price: 18.50,
    compareAtPrice: 22.00,
    shortDescription: 'Deep conceptual essays exploring ethics in automated AI ages.',
    description: 'An elegant hardback digest reviewing human values, digital presence, and social consciousness systems.',
    tags: ['philosophy', 'essays', 'hardcover'],
    imageUrls: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'budget'
  },
  {
    name: 'Advanced Software Architecture Vol 2',
    slugSuffix: 'advanced-software-architecture-vol-2',
    categorySlug: 'books',
    brand: 'Syntactix',
    price: 59.99,
    compareAtPrice: 69.99,
    shortDescription: 'A complete university-grade manual of high scale distributed designs.',
    description: 'Covers database replication topologies, distributed consensus engines, event driven patterns, and security layers completely.',
    tags: ['computer-science', 'tech-manual', 'textbook'],
    imageUrls: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'mid-range'
  },
  {
    name: 'Ancient Mythologies Revisited Guide',
    slugSuffix: 'ancient-mythologies-revisited-guide',
    categorySlug: 'books',
    brand: 'ChroniclePublishing',
    price: 21.99,
    compareAtPrice: 24.99,
    shortDescription: 'A wonderfully illustrated companion to ancient tales and folklore.',
    description: 'Brimming with raw detailed vector drawings and historical references mapped to ancient world geography records.',
    tags: ['history', 'illustrated', 'mythology'],
    imageUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'budget'
  },
  {
    name: 'High-Performance Mindset Workbook',
    slugSuffix: 'high-performance-mindset-workbook',
    categorySlug: 'books',
    brand: 'ChroniclePublishing',
    price: 12.99,
    compareAtPrice: 15.99,
    shortDescription: 'Practical cognitive habits designed to prevent work fatigue.',
    description: 'Contains structured progress tracking prompts, weekly focus schedules, and science-backed anxiety relief loops.',
    tags: ['self-help', 'productivity', 'workbook'],
    imageUrls: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'],
    variantType: 'books',
    pricingTier: 'budget'
  },

  // --- Category: Beauty (6 items) ---
  {
    name: 'Vitamin C Brightening Hydra Serum',
    slugSuffix: 'vitamin-c-brightening-hydra-serum',
    categorySlug: 'beauty',
    brand: 'Botanica',
    price: 34.99,
    compareAtPrice: 39.99,
    shortDescription: 'Incredibly soothing organic serum to reduce facial skin discoloration.',
    description: 'Infused with botanical rosehip oil and antioxidant vitamins. Locks in cellular moisture to establish vibrant elasticity.',
    tags: ['skincare', 'organic', 'serum'],
    imageUrls: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Tea Tree Foaming Daily Cleanser',
    slugSuffix: 'tea-tree-foaming-daily-cleanser',
    categorySlug: 'beauty',
    brand: 'GlowLabs',
    price: 18.50,
    compareAtPrice: 22.00,
    shortDescription: 'pH-Balanced sulfate free gentle cleansing foam facial wash.',
    description: 'Combines purifying natural tea tree leaf extracts with soothing aloe vera paths. Excellent for clearing acne pores.',
    tags: ['cleanser', 'acme-control', 'vegan'],
    imageUrls: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Hyaluronic Acid Surge Day Cream',
    slugSuffix: 'hyaluronic-acid-surge-day-cream',
    categorySlug: 'beauty',
    brand: 'GlowLabs',
    price: 24.99,
    compareAtPrice: 29.99,
    shortDescription: 'Weightless high hydration daily skin moisture barrier lock.',
    description: 'An advanced micro-droplet formula that absorbs instantly without leaving sticky oil layers. Keeps makeup fresh all day.',
    tags: ['moisturizer', 'daily-cream', 'skin-science'],
    imageUrls: ['https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Nourishing Argan Oil Hair Treatment',
    slugSuffix: 'nourishing-argan-oil-hair-treatment',
    categorySlug: 'beauty',
    brand: 'Botanica',
    price: 29.99,
    compareAtPrice: 34.99,
    shortDescription: 'Reference level Moroccan argan oil styling treatment.',
    description: 'Eradicates fuzzy dry ends instantly. Restores radiant high-gloss strength to hairs damaged by extreme heat dryers.',
    tags: ['haircare', 'argan-oil', 'natural-beauty'],
    imageUrls: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Velvet Silk Liquid Mineral Foundation',
    slugSuffix: 'velvet-silk-liquid-mineral-foundation',
    categorySlug: 'beauty',
    brand: 'GlowLabs',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Medium coverage breathable foundation with mineral SPF15.',
    description: 'Blends seamlessly matching real undertones. Lightweight mineral pigments protect skin from environmental dust elements.',
    tags: ['cosmetics', 'makeup', 'foundation'],
    imageUrls: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Anti-Aging Active Retinol Repair Cream',
    slugSuffix: 'anti-aging-active-retinol-repair-cream',
    categorySlug: 'beauty',
    brand: 'Botanica',
    price: 64.99,
    compareAtPrice: 74.99,
    shortDescription: 'Rich evening repair moisturizer loaded with 2.5% pure retinol.',
    description: 'Reduces fine line creases and rebuilds collagen densities while you sleep. Infused with skin soothing botanical ceramides.',
    tags: ['retinol', 'collagen', 'premium-care'],
    imageUrls: ['https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'premium'
  },

  // --- Category: Accessories (6 items) ---
  {
    name: 'RFID Slim Minimalist Leather Wallet',
    slugSuffix: 'rfid-slim-minimalist-leather-wallet',
    categorySlug: 'accessories',
    brand: 'UrbanCargo',
    price: 34.99,
    compareAtPrice: 39.99,
    shortDescription: 'Genuine top grain leather card holder with card slide triggers.',
    description: 'Safeguard credit card chips against scanning theft tags. Push indicators fan out 6 cards in beautiful stairs layout.',
    tags: ['wallet', 'rfid-block', 'edc'],
    imageUrls: ['https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'ProShield Blue Light Screen Glasses',
    slugSuffix: 'proshield-blue-light-screen-glasses',
    categorySlug: 'accessories',
    brand: 'VisionOptics',
    price: 24.99,
    compareAtPrice: 29.99,
    shortDescription: 'Anti eyestrain computer glasses with lightweight metal frame.',
    description: 'Block 95% of high frequency screen blue wavelengths. Mitigate headache fatigue during long coding cycles.',
    tags: ['glasses', 'eyestrain', 'workplace'],
    imageUrls: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Quartz Classic Chronograph Leather Watch',
    slugSuffix: 'quartz-classic-chronograph-leather-watch',
    categorySlug: 'accessories',
    brand: 'VisionOptics',
    price: 129.99,
    compareAtPrice: 149.99,
    shortDescription: 'Japanese quartz movement wrist watch with leather straps.',
    description: 'Sophisticated multi-dial layout containing stopwatch functions, date windows, and premium surgical grade steel casings.',
    tags: ['watches', 'chronograph', 'leather-strap'],
    imageUrls: ['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Commuter Shield Waterproof Laptop Pack',
    slugSuffix: 'commuter-shield-waterproof-laptop-pack',
    categorySlug: 'accessories',
    brand: 'UrbanCargo',
    price: 79.99,
    compareAtPrice: 89.99,
    shortDescription: 'High density waterproof travel backpack with USB charging locks.',
    description: 'Keeps tablets and books bone dry under cloud bursts. Multi internal mesh divider structures prevent cargo jostles.',
    tags: ['backpack', 'commuter', 'waterproof-bag'],
    imageUrls: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'mid-range'
  },
  {
    name: 'Woven Silk Patterned Winter Scarf',
    slugSuffix: 'woven-silk-patterned-winter-scarf',
    categorySlug: 'accessories',
    brand: 'UrbanCargo',
    price: 49.99,
    compareAtPrice: 59.99,
    shortDescription: 'Premium warm silk and cashmere blend neck wrap scarf.',
    description: 'Features a contemporary geometric pattern structure, elegant fringe accents, and a luxury soft touch texture feeling.',
    tags: ['scarf', 'winter-wear', 'fashion-tech'],
    imageUrls: ['https://images.unsplash.com/photo-1520903928273-0f4432a288b0?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  },
  {
    name: 'Aviation Pilot Polarized UV Sunglasses',
    slugSuffix: 'aviation-pilot-polarized-uv-sunglasses',
    categorySlug: 'accessories',
    brand: 'VisionOptics',
    price: 39.99,
    compareAtPrice: 44.99,
    shortDescription: 'Impact-resistant military grade aviation pilot solar glasses.',
    description: 'Eliminate glare reflection on damp road surfaces or sea waters. Solid metal spring temples ensure snug non-slip head fits.',
    tags: ['sunglasses', 'polarized', 'aviator'],
    imageUrls: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'],
    variantType: 'general-colors',
    pricingTier: 'budget'
  }
];

// Let's programmatically expand rawProducts to EXACTLY 100 products to satisfy the constraint!
// We can multiply and customize names slightly (e.g. adding Series, Generation, Edition) to make them completely unique and realistic.
const finalProductsArray: IRawProductSpec[] = [];

// Base array has 50 items. Let's create an elegant multiplier to get to exactly 100 completely unique products.
// We will generate direct customized variations based on the base array to maintain realistic data descriptions, brands, prices etc.
for (let i = 0; i < 100; i++) {
  const baseItem = rawProducts[i % rawProducts.length];
  const iteration = Math.floor(i / rawProducts.length); // 0 or 1
  
  if (iteration === 0) {
    // Keep exactly as is
    finalProductsArray.push({
      ...baseItem,
      name: baseItem.name,
      slugSuffix: `${baseItem.slugSuffix}`
    });
  } else {
    // Create Pro, Ultra, Carbon, or V2 editions to keep it realistic and ensure unique names/slugs
    let suffix = 'V2';
    let suffixWord = 'V2 Edition';
    let priceMultiplier = 1.15;
    
    if (i % 3 === 0) {
      suffix = 'pro';
      suffixWord = 'Pro Carbon';
      priceMultiplier = 1.25;
    } else if (i % 3 === 1) {
      suffix = 'elite';
      suffixWord = 'Elite Series';
      priceMultiplier = 1.10;
    } else {
      suffix = 'luxe';
      suffixWord = 'Luxe Edition';
      priceMultiplier = 1.35;
    }
    
    const newPrice = Math.round((baseItem.price * priceMultiplier) * 100) / 100;
    const newComparePrice = baseItem.compareAtPrice ? Math.round((baseItem.compareAtPrice * priceMultiplier) * 100) / 100 : undefined;
    
    finalProductsArray.push({
      ...baseItem,
      name: `${baseItem.name} ${suffixWord}`,
      slugSuffix: `${baseItem.slugSuffix}-${suffix}`,
      price: newPrice,
      compareAtPrice: newComparePrice,
      shortDescription: `Upgraded next-generation variant: ${baseItem.shortDescription}`,
      description: `The premium redefined ${suffixWord} of our customer-favourite model. ${baseItem.description}`,
      tags: [...baseItem.tags, suffix],
      pricingTier: baseItem.pricingTier === 'budget' ? 'mid-range' : 'premium'
    });
  }
}

export const seedProducts = async (shouldExit = true) => {
  try {
    if (!env.mongoUri || env.mongoUri === 'TO_BE_ADDED') {
      console.warn('MONGO_URI is missing or TO_BE_ADDED. Skipping seed.');
      if (shouldExit) process.exit(0);
      return;
    }

    await connectDB();
    console.log('Connected to Database. Restructuring Category system first to ensure safety...');

    // 1. Verify/Sync Categories first
    const categoriesSeedData = [
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

    // Ensure all 15 categories are present
    const categoryMap: { [slug: string]: mongoose.Types.ObjectId } = {};
    for (const cat of categoriesSeedData) {
      let existingCat = await Category.findOne({ slug: cat.slug });
      if (!existingCat) {
        existingCat = await Category.create(cat);
        console.log(`Created Category: ${cat.name}`);
      }
      categoryMap[cat.slug] = existingCat._id as mongoose.Types.ObjectId;
    }

    // Ensure we have an Admin Owner
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Seed Admin',
        email: `seed_admin_${Date.now()}@example.com`,
        role: 'admin',
        passwordHash: 'dummy',
        isEmailVerified: true
      });
      console.log(`Created Admin user: ${admin.email}`);
    }

    // 2. Clear previous Product entries to prevent stale metadata
    const deletionResult = await Product.deleteMany({});
    console.log(`Cleared ${deletionResult.deletedCount} existing products.`);

    // 3. Map productsRaw dynamically to conform exactly to mongoose schema
    const finalProductDocuments = [];

    for (let idx = 0; idx < finalProductsArray.length; idx++) {
      const spec = finalProductsArray[idx];
      const categoryId = categoryMap[spec.categorySlug];

      if (!categoryId) {
        throw new Error(`Critical Error: Category slug '${spec.categorySlug}' not found in map.`);
      }

      // Exact distribution parameters:
      // First 65% (idx 0 to 64): status = 'active', isFeatured = false
      // Next 20% (idx 65 to 84): status = 'active', isFeatured = true
      // Last 15% (idx 85 to 99): status = 'draft', isFeatured = false
      let status: 'active' | 'draft' = 'active';
      let isFeatured = false;

      if (idx >= 65 && idx <= 84) {
        isFeatured = true;
      } else if (idx >= 85) {
        status = 'draft';
      }

      // Stock Level distribution:
      // Index divisibility determines stock patterns to offer rich variance:
      // every 10th item (10%) is completely 'out of stock' (total 0 stock)
      // every 7th item (15%) is 'low stock' (total 2 to 4 stock)
      // remaining (75%) is fully 'in stock' (total 35 to 110 stock)
      let stockScenario: 'out' | 'low' | 'high' = 'high';
      if (idx % 10 === 0) {
        stockScenario = 'out';
      } else if (idx % 7 === 0) {
        stockScenario = 'low';
      }

      // Generate customized variants based on type requirements
      const variants = [];
      const images = spec.imageUrls.map((url, i) => ({
        public_id: `product_${spec.slugSuffix}_${i}`,
        secure_url: url,
        altText: `${spec.name} - View ${i + 1}`
      }));

      if (spec.variantType === 'phones') {
        const storages = ['128GB', '256GB', '512GB'];
        const colors = [
          { name: 'Black', hex: '#000000' },
          { name: 'White', hex: '#FFFFFF' },
          { name: 'Blue', hex: '#0000FF' }
        ];

        for (const storage of storages) {
          for (const col of colors) {
            let stock = 40;
            if (stockScenario === 'out') {
              stock = 0;
            } else if (stockScenario === 'low') {
              stock = Math.floor(Math.random() * 3) + 1; // 1 to 3
            }

            const sku = `SKU-PHONE-${spec.slugSuffix.toUpperCase()}-${col.name.substring(0, 3).toUpperCase()}-${storage}`;
            variants.push({
              sku,
              size: storage,
              color: col.name,
              colorHex: col.hex,
              stock,
              priceOverride: storage === '512GB' ? spec.price + 150 : storage === '256GB' ? spec.price + 70 : undefined,
              images: images,
              attributes: [
                { name: 'Storage', value: storage },
                { name: 'Color', value: col.name }
              ]
            });
          }
        }
      } else if (spec.variantType === 'clothing') {
        const sizes = ['S', 'M', 'L', 'XL'];
        const colors = [
          { name: 'Black', hex: '#000000' },
          { name: 'White', hex: '#FFFFFF' },
          { name: 'Red', hex: '#FF0000' }
        ];

        for (const size of sizes) {
          for (const col of colors) {
            let stock = 60;
            if (stockScenario === 'out') {
              stock = 0;
            } else if (stockScenario === 'low') {
              stock = Math.floor(Math.random() * 3) + 1;
            }

            const sku = `SKU-CLOTH-${spec.slugSuffix.toUpperCase()}-${col.name.substring(0, 3).toUpperCase()}-${size}`;
            variants.push({
              sku,
              size,
              color: col.name,
              colorHex: col.hex,
              stock,
              images: images,
              attributes: [
                { name: 'Size', value: size },
                { name: 'Color', value: col.name }
              ]
            });
          }
        }
      } else if (spec.variantType === 'laptops') {
        const specsOption = ['8GB/256GB', '16GB/512GB', '32GB/1TB'];
        for (const specOpt of specsOption) {
          let stock = 25;
          if (stockScenario === 'out') {
            stock = 0;
          } else if (stockScenario === 'low') {
            stock = Math.floor(Math.random() * 3) + 1;
          }

          const priceFactor = specOpt === '32GB/1TB' ? 250 : specOpt === '16GB/512GB' ? 100 : 0;
          const sku = `SKU-LAP-${spec.slugSuffix.toUpperCase()}-${specOpt.replace('/', '-').toUpperCase()}`;
          variants.push({
            sku,
            size: specOpt,
            stock,
            priceOverride: priceFactor > 0 ? spec.price + priceFactor : undefined,
            images: images,
            attributes: [{ name: 'Specification', value: specOpt }]
          });
        }
      } else {
        // general-colors, footwear, books
        const colList = [
          { name: 'Black', hex: '#000000' },
          { name: 'White', hex: '#FFFFFF' }
        ];

        for (const col of colList) {
          let stock = 30;
          if (stockScenario === 'out') {
            stock = 0;
          } else if (stockScenario === 'low') {
            stock = Math.floor(Math.random() * 3) + 1;
          }

          const sku = `SKU-GEN-${spec.slugSuffix.toUpperCase()}-${col.name.toUpperCase()}`;
          variants.push({
            sku,
            color: col.name,
            colorHex: col.hex,
            stock,
            images: images,
            attributes: [{ name: 'Color', value: col.name }]
          });
        }
      }

      finalProductDocuments.push({
        name: spec.name,
        slug: spec.slugSuffix,
        description: spec.description,
        shortDescription: spec.shortDescription,
        category: categoryId,
        brand: spec.brand,
        images: images,
        variants: variants,
        price: spec.price,
        compareAtPrice: spec.compareAtPrice,
        tags: spec.tags,
        status: status,
        isFeatured: isFeatured,
        salesCount: Math.floor(Math.random() * 120),
        viewCount: Math.floor(Math.random() * 2000) + 50,
        metaTitle: `${spec.name} | Premium ${spec.categorySlug.toUpperCase()} Brand`,
        metaDescription: `Buy ${spec.name} online at top-rated rates! ${spec.shortDescription}`,
        lowStockThreshold: 5,
        createdBy: admin._id,
        createdAt: new Date(Date.now() - (99 - idx) * 3600000), // Slightly staggered creation dates
        updatedAt: new Date()
      });
    }

    // 4. Perform insertMany sequence
    const insertedResults = await Product.insertMany(finalProductDocuments);
    console.log(`Successfully seeded EXACTLY ${insertedResults.length} high-fidelity products linked to key categories!`);

    if (shouldExit) process.exit(0);
  } catch (err) {
    console.error('Error during product seeding operation:', err);
    if (shouldExit) process.exit(1);
    throw err;
  }
};

if (process.argv[1] && process.argv[1].includes('seedProducts')) {
  seedProducts(true);
}
