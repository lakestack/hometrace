import mongoose, { Schema, Document } from 'mongoose';

export interface UserItem extends Document {
  email: string;
  password?: string;
  role: string; // 'admin' | 'agent' | 'customer'
  firstName: string;
  lastName: string;
}

const UserSchema: Schema<UserItem> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false }, // select: false prevents password from being returned in queries
  role: {
    type: String,
    enum: ['admin', 'agent', 'customer'],
    default: 'customer',
    required: true,
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
});

const User =
  mongoose.models.User || mongoose.model<UserItem>('User', UserSchema);

export default User;
