import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import { connectDB } from '../config/db.js';

dotenv.config();

import { env } from '../config/env.js';

export const seedAdmin = async (shouldExit = true) => {
  try {
    if (!env.mongoUri || env.mongoUri === 'TO_BE_ADDED') {
      console.warn('MONGO_URI is missing or TO_BE_ADDED. Skipping seed.');
      if (shouldExit) process.exit(0);
      return;
    }

    await connectDB();

    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists. Making sure role is admin...');
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
      }
      console.log('Admin user seed completed (Idempotent).');
      if (shouldExit) process.exit(0);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    await User.create({
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isEmailVerified: true
    });

    console.log('Admin user created successfully.');
    console.log(`Email: ${adminEmail} | Password: admin123`);
    if (shouldExit) process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};

if (process.argv[1] && process.argv[1].includes('seedAdmin')) {
  seedAdmin(true);
}
