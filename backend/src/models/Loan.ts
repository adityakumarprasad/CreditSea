import mongoose, { Schema, Document } from 'mongoose';

export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'DISBURSED' | 'CLOSED' | 'REJECTED';

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  amount: number;
  tenure: number; // in days
  interestRate: number; // fixed 12 (represents 12% p.a.)
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  disbursedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema = new Schema(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenure: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, required: true, default: 12 },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    outstandingBalance: { type: Number, required: true },
    status: {
      type: String,
      enum: ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'],
      required: true,
      default: 'APPLIED',
    },
    rejectionReason: { type: String, required: false },
    disbursedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
