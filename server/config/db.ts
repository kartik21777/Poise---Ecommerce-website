import mongoose from 'mongoose';
import { env } from './env.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: any = null;

export const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      console.warn('MONGO_URI is not defined. Skipping database connection.');
      return;
    }

    // Spin up an in-memory database on port 27017 if targeting localhost in local dev mode
    if (
      env.nodeEnv !== 'production' &&
      env.nodeEnv !== 'staging' &&
      (env.mongoUri.includes('127.0.0.1:27017') || env.mongoUri.includes('localhost:27017'))
    ) {
      try {
        mongod = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'poise'
          }
        });
        console.log(`[Database] In-memory MongoDB server runs on: ${mongod.getUri()}`);
      } catch (err: any) {
        if (err.message && (err.message.includes('EADDRINUSE') || err.message.includes('already in use'))) {
          console.log('[Database] MongoDB port 27017 in use. Connecting to existing process.');
        } else {
          console.warn('[Database] Optional in-memory server startup notice:', err.message || err);
        }
      }
    }

    const conn = await mongoose.connect(env.mongoUri, {
      maxPoolSize: 50,
      minPoolSize: 10,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
