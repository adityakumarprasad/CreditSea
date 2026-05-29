import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection' | 'Borrower';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection', 'Borrower'],
      required: true,
      default: 'Borrower',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
