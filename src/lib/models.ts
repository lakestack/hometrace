/**
 * Central Model Registry
 *
 * This file ensures all Mongoose models are registered when imported.
 * Import this file in any API route or server-side code that uses Mongoose
 * to guarantee all models are available for operations like $lookup.
 *
 * This solves the "Schema hasn't been registered for model" error that occurs
 * when models are used implicitly (e.g., in aggregation pipelines with $lookup).
 *
 * Usage:
 * 1. Import at the top of any API file: import '@/lib/models';
 * 2. Or use the function: import { ensureModelsRegistered } from '@/lib/models';
 * 3. Or import specific models: import { User, Property, Appointment } from '@/lib/models';
 */

import mongoose from 'mongoose';

// Import all models to ensure they are registered
import User from '@/models/user';
import Property from '@/models/property';
import Appointment from '@/models/appointment';

// Export all models for convenience
export { User, Property, Appointment };

// Export a function to ensure models are registered
export function ensureModelsRegistered() {
  // This function doesn't need to do anything - just importing the models above
  // is enough to register them with Mongoose

  // Optional: Log registered models in development
  if (process.env.NODE_ENV === 'development') {
    const registeredModels = Object.keys(mongoose.models);
    console.log('Registered Mongoose models:', registeredModels);
  }

  return {
    User,
    Property,
    Appointment,
  };
}

// Function to check if all required models are registered
export function validateModelsRegistered(): boolean {
  const requiredModels = ['User', 'Property', 'Appointment'];
  const registeredModels = Object.keys(mongoose.models);

  const missingModels = requiredModels.filter(
    (model) => !registeredModels.includes(model),
  );

  if (missingModels.length > 0) {
    console.error('Missing Mongoose models:', missingModels);
    return false;
  }

  return true;
}

// Default export for easy importing
export default {
  User,
  Property,
  Appointment,
  ensureModelsRegistered,
  validateModelsRegistered,
};
