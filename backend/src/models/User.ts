import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  subscription: {
    status: 'active' | 'inactive' | 'expired';
    plan: string;
    expiresAt: Date;
  };
  lastSyncedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
    },
    plan: {
      type: String,
      default: 'free',
    },
    expiresAt: {
      type: Date,
    },
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
