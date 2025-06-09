import mongoose from 'mongoose';
import { ensureModelsRegistered, validateModelsRegistered } from '@/lib/models';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable in .env.local',
  );
}

const cached: MongooseCache =
  global.mongoose ||
  (global.mongoose = {
    conn: null,
    promise: null,
  });

async function connectMongo(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;

    // Ensure all models are registered after connection
    ensureModelsRegistered();

    // Validate that all required models are registered (in development)
    if (process.env.NODE_ENV === 'development') {
      validateModelsRegistered();
    }

    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

export default connectMongo;
