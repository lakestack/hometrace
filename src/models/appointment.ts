import mongoose, { Document } from 'mongoose';
import { PropertyItem } from './property';

export interface AppointmentItem extends Document {
  propertyId: string | PropertyItem;
  agentId?: mongoose.Types.ObjectId; // Reference to the agent who manages this appointment
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  customerPreferredDates: Array<{
    date: string;
    time: string;
  }>;
  agentScheduledDateTime?: Date; // Agent's confirmed scheduled date/time
  status?: 'pending' | 'confirmed' | 'cancelled';
  message?: string;
  createdAt: Date;
}

const appointmentSchema = new mongoose.Schema<AppointmentItem>({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional - will be set when property has an agent
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  customerPreferredDates: {
    type: [
      {
        date: {
          type: String,
          required: true,
          validate: {
            validator: function (v: string) {
              return /^\d{4}-\d{2}-\d{2}$/.test(v);
            },
            message: 'Date must be in YYYY-MM-DD format',
          },
        },
        time: {
          type: String,
          required: true,
          validate: {
            validator: function (v: string) {
              return /^\d{2}:\d{2}$/.test(v);
            },
            message: 'Time must be in HH:MM format',
          },
        },
      },
    ],
    required: true,
    // Temporarily disable validation to allow fixing legacy data
    // validate: {
    //   validator: function (v: any[]) {
    //     // Allow empty array for existing appointments, but require 1-3 items for new appointments
    //     if (this.isNew) {
    //       return Array.isArray(v) && v.length > 0 && v.length <= 3;
    //     } else {
    //       // For updates, allow empty array or 1-3 items
    //       return Array.isArray(v) && v.length >= 0 && v.length <= 3;
    //     }
    //   },
    //   message: 'Must have between 1 and 3 preferred dates for new appointments',
    // },
  },
  agentScheduledDateTime: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  message: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add pre-save middleware for debugging
appointmentSchema.pre('save', function (next) {
  console.log('Saving appointment:', {
    id: this._id,
    customerPreferredDates: this.customerPreferredDates,
    agentScheduledDateTime: this.agentScheduledDateTime,
    status: this.status,
    isNew: this.isNew,
    modifiedPaths: this.modifiedPaths(),
  });
  next();
});

// Add post-save middleware for debugging
appointmentSchema.post('save', function (doc) {
  console.log('Appointment saved successfully:', {
    id: doc._id,
    customerPreferredDates: doc.customerPreferredDates,
    agentScheduledDateTime: doc.agentScheduledDateTime,
    status: doc.status,
  });
});

const Appointment =
  (mongoose.models.Appointment as mongoose.Model<AppointmentItem>) ||
  mongoose.model<AppointmentItem>('Appointment', appointmentSchema);

export default Appointment;
