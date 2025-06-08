import mongoose, { Document } from 'mongoose';

export type Address = {
  street: string;
  suburb: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
  postcode: string;
  country?: string;
};

export const PropertyType = {
  HOUSE: 'House',
  APARTMENT: 'Apartment',
  TOWNHOUSE: 'Townhouse',
  UNIT: 'Unit',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  DUPLEX: 'Duplex',
} as const;

export type PropertyTypeValue =
  (typeof PropertyType)[keyof typeof PropertyType];

export interface PropertyItem extends Document {
  description: string;
  price: number | string | null;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: string;
  images?: string[];
  address: Address;
  propertyType?: PropertyTypeValue;
  landSize?: number;
  features?: string[];
  agentId?: mongoose.Types.ObjectId; // Reference to the agent who manages this property
  createdAt?: Date;
  updatedAt?: Date;
}

const propertySchema = new mongoose.Schema<PropertyItem>({
  description: {
    type: String,
    required: true,
  },
  price: {
    type: mongoose.Schema.Types.Mixed,
    validate: {
      validator: function (v) {
        if (v === null || v === undefined || v === '') {
          return true; // Allows empty
        }
        if (typeof v === 'number' && !isNaN(v)) {
          return true; // Allows number
        }
        if (typeof v === 'string' && v.includes('-')) {
          const range = v.split('-').map(Number);
          return (
            range.length === 2 &&
            !isNaN(range[0]) &&
            !isNaN(range[1]) &&
            range[0] <= range[1]
          ); // Allows "min-max" string
        }
        return false;
      },
      message:
        'Price must be a number, a range (e.g., "100000-200000"), or empty.',
    },
  },
  area: {
    type: Number, // Property area, e.g. 230 square meters
  },
  bedrooms: {
    type: Number,
  },
  bathrooms: {
    type: Number,
  },
  parking: {
    type: String, // E.g., 'Carport', 'Garage', 'Off-street', 'None'
  },
  images: {
    type: [String],
    default: [],
  },
  address: {
    street: {
      type: String,
      required: true,
    },
    suburb: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'], // Optional: restricts to Australian states/territories
    },
    postcode: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^\d{4}$/.test(v); // Simple 4-digit Australian postcode validation
        },
        message: 'Postcode must be a 4-digit number.',
      },
    },
    country: {
      type: String,
      default: 'Australia',
    },
  },
  propertyType: {
    type: String,
    enum: Object.values(PropertyType),
  },
  landSize: {
    type: Number, // Land area, e.g. 900 square meters
  },
  features: {
    type: [String], // E.g., ['Air Conditioning', 'Balcony', 'Dishwasher']
    default: [],
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional - some properties might not have an assigned agent
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Helper function to sanitize search input and prevent NoSQL injection
function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove special regex characters that could be used for injection
  return input
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
    .trim()
    .substring(0, 100); // Limit length to prevent abuse
}

propertySchema.statics.buildSearchQuery = function (search: string) {
  const sanitizedSearch = sanitizeSearchInput(search);

  if (!sanitizedSearch) {
    return {};
  }

  return {
    $or: [
      { 'address.street': { $regex: sanitizedSearch, $options: 'i' } },
      { 'address.suburb': { $regex: sanitizedSearch, $options: 'i' } },
      { 'address.state': { $regex: sanitizedSearch, $options: 'i' } },
      { 'address.postcode': { $regex: sanitizedSearch, $options: 'i' } },
    ],
  };
};

const Property =
  (mongoose.models.Property as mongoose.Model<PropertyItem>) ||
  mongoose.model<PropertyItem>('Property', propertySchema);

export default Property;
