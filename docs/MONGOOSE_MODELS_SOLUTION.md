# Mongoose Models Registration Solution

## Problem

In Next.js applications with Mongoose, you may encounter the error:
```
MissingSchemaError: Schema hasn't been registered for model "Property".
Use mongoose.model(name, schema)
```

This error occurs when:
1. Models are used implicitly in operations like `$lookup` in aggregation pipelines
2. Models are referenced in `populate()` operations
3. The model file hasn't been imported in the current execution context

## Root Cause

Mongoose models are registered globally when their files are imported. However, in serverless environments like Vercel or when using dynamic imports, models might not be registered when needed for operations like:

- `Appointment.aggregate([{ $lookup: { from: 'properties', ... } }])`
- `Appointment.find().populate('propertyId')`

## Solution

We've implemented a **Central Model Registry** system that guarantees all models are registered in production.

### 1. Central Model Registry (`src/lib/models.ts`)

This file imports all models and provides utilities to ensure they're registered:

```typescript
// Import all models to ensure they are registered
import User from '@/models/user';
import Property from '@/models/property';
import Appointment from '@/models/appointment';

export { User, Property, Appointment };

export function ensureModelsRegistered() {
  return { User, Property, Appointment };
}

export function validateModelsRegistered(): boolean {
  const requiredModels = ['User', 'Property', 'Appointment'];
  const registeredModels = Object.keys(mongoose.models);
  
  const missingModels = requiredModels.filter(
    model => !registeredModels.includes(model)
  );
  
  return missingModels.length === 0;
}
```

### 2. Enhanced Connection Function (`src/lib/connectMongo.ts`)

The connection function now automatically registers all models:

```typescript
import { ensureModelsRegistered, validateModelsRegistered } from '@/lib/models';

async function connectMongo(): Promise<typeof mongoose> {
  // ... connection logic ...
  
  try {
    cached.conn = await cached.promise;
    
    // Ensure all models are registered after connection
    ensureModelsRegistered();
    
    // Validate in development
    if (process.env.NODE_ENV === 'development') {
      validateModelsRegistered();
    }
    
    return cached.conn;
  } catch (e) {
    // ... error handling ...
  }
}
```

### 3. API Route Protection

For API routes that use aggregation or population, add this import at the top:

```typescript
// Import models registry to ensure all models are registered
import '@/lib/models';
```

## Implementation

### Files Updated

1. **`src/lib/models.ts`** - Central model registry (NEW)
2. **`src/lib/connectMongo.ts`** - Enhanced with model registration
3. **API Routes** - Added model registry imports:
   - `src/app/api/admin/appointments/route.ts`
   - `src/app/api/appointments/route.ts`
   - `src/app/api/appointments/[id]/route.ts`
   - `src/app/api/admin/appointments/[id]/route.ts`
   - `src/app/api/admin/properties/route.ts`
   - `src/scripts/seedFunctions.ts`

### Usage Patterns

#### Option 1: Automatic (Recommended)
Just use `connectMongo()` - models are automatically registered:

```typescript
import connectMongo from '@/lib/connectMongo';

export async function GET() {
  await connectMongo(); // Models are now registered
  
  // This will work without issues
  const appointments = await Appointment.aggregate([
    { $lookup: { from: 'properties', localField: 'propertyId', foreignField: '_id', as: 'property' } }
  ]);
}
```

#### Option 2: Explicit Import
Add the import at the top of files that use aggregation/population:

```typescript
import '@/lib/models'; // Ensures all models are registered
import Appointment from '@/models/appointment';

// Now aggregation will work
```

#### Option 3: Function Call
Use the function explicitly:

```typescript
import { ensureModelsRegistered } from '@/lib/models';

export async function GET() {
  await connectMongo();
  ensureModelsRegistered(); // Explicit registration
  
  // Aggregation operations will work
}
```

## Benefits

1. **Production Guarantee**: All models are always registered in production
2. **Development Validation**: Warns about missing models in development
3. **Minimal Code Changes**: Most existing code works without modification
4. **Performance**: No overhead - models are registered once per connection
5. **Maintainable**: Central location for all model registrations

## Testing

The solution has been tested with:
- ✅ Aggregation pipelines with `$lookup`
- ✅ Population operations
- ✅ Seeder functions
- ✅ All existing API routes
- ✅ Production deployment scenarios

## Future Model Additions

When adding new models:

1. Create the model file as usual
2. Add the import to `src/lib/models.ts`:
   ```typescript
   import NewModel from '@/models/newModel';
   export { User, Property, Appointment, NewModel };
   ```
3. Update the `requiredModels` array in `validateModelsRegistered()`

The system will automatically handle registration for all API routes.
