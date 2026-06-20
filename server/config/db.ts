import mongoose from 'mongoose';
import { env } from './env.js';

let mongod: any = null;

export const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      console.warn('MONGO_URI is not defined. Skipping database connection.');
      return;
    }

    // Start in-memory MongoDB only for local development
    if (
      env.nodeEnv !== 'production' &&
      env.nodeEnv !== 'staging' &&
      (env.mongoUri.includes('127.0.0.1:27017') ||
        env.mongoUri.includes('localhost:27017'))
    ) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');

        mongod = await MongoMemoryServer.create({
          instance: {
            port: 27017,
            dbName: 'poise',
          },
        });

        console.log(
          `[Database] In-memory MongoDB server runs on: ${mongod.getUri()}`
        );
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);

        if (
          errorMessage.includes('EADDRINUSE') ||
          errorMessage.includes('already in use')
        ) {
          console.log(
            '[Database] MongoDB port 27017 in use. Connecting to existing process.'
          );
        } else {
          console.warn(
            '[Database] Optional in-memory server startup notice:',
            errorMessage
          );
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
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error(`Error connecting to MongoDB: ${errorMessage}`);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();

    if (mongod) {
      await mongod.stop();
      mongod = null;
    }

    console.log('MongoDB disconnected');
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error(`Error disconnecting MongoDB: ${errorMessage}`);
  }
};