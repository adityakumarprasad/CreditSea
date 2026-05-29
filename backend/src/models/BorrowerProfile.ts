import mongoose, { Schema, Document } from 'mongoose';

export type EmploymentMode = 'Salaried' | 'Self-Employed' | 'Unemployed';

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BorrowerProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['Salaried', 'Self-Employed', 'Unemployed'],
      required: true,
    },
    salarySlipUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<IBorrowerProfile>('BorrowerProfile', BorrowerProfileSchema);
