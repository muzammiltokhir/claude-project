import mongoose, { Document, Schema } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface IUser extends Document {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  updateLastLogin(): Promise<IUser>;
  isAdmin(): boolean;
}

const userSchema = new Schema<IUser>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    photoURL: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    profile: {
      firstName: {
        type: String,
        trim: true,
      },
      lastName: {
        type: String,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
      },
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        const obj = ret.toObject ? ret.toObject() : ret;
        delete obj.__v;
        return obj;
      },
    },
    versionKey: false,
  }
);

// Indexes for better query performance
userSchema.index({ uid: 1, isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Static method to find by Firebase UID
userSchema.statics.findByUID = function(uid: string) {
  return this.findOne({ uid, isActive: true });
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === UserRole.ADMIN;
};

export const User = mongoose.model<IUser>('User', userSchema);