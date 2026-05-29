import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middlewares/auth';
import User from '../models/User';
import BorrowerProfile from '../models/BorrowerProfile';
import Loan from '../models/Loan';
import Payment from '../models/Payment';
import mongoose from 'mongoose';

const router = Router();

// Guard all operations routes
router.use(authenticateToken);

// ==========================================
// 1. SALES MODULE (Leads Tracking)
// Access: Sales & Admin
// ==========================================
router.get('/sales/leads', requireRoles(['Sales']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // A lead is a Borrower who hasn't applied for a loan yet.
    // Let's find all borrowers, check their profiles and loan applications.
    const borrowers = await User.find({ role: 'Borrower' }).select('-passwordHash');
    
    const leads = [];
    
    for (const borrower of borrowers) {
      // Check if borrower has any loan applications
      const hasApplied = await Loan.exists({ borrowerId: borrower._id });
      
      if (!hasApplied) {
        // Fetch profile details if they've completed Step 2/3
        const profile = await BorrowerProfile.findOne({ userId: borrower._id });
        leads.push({
          user: borrower,
          profile: profile || null,
          stepReached: profile ? (profile.salarySlipUrl ? 3 : 2) : 1
        });
      }
    }

    res.status(200).json(leads);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ==========================================
// 2. SANCTION MODULE (Review & Approve/Reject)
// Access: Sanction & Admin
// ==========================================
router.get('/sanction/loans', requireRoles(['Sanction']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Find loans with status 'APPLIED'
    const loans = await Loan.find({ status: 'APPLIED' }).sort({ createdAt: 1 });
    
    const detailedLoans = [];
    for (const loan of loans) {
      const borrower = await User.findById(loan.borrowerId).select('-passwordHash');
      const profile = await BorrowerProfile.findOne({ userId: loan.borrowerId });
      detailedLoans.push({
        loan,
        borrower,
        profile
      });
    }

    res.status(200).json(detailedLoans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/sanction/review/:loanId', requireRoles(['Sanction']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { loanId } = req.params;
  const { action, reason } = req.body; // action: 'approve' | 'reject'

  if (!action || !['approve', 'reject'].includes(action)) {
    res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    return;
  }

  if (action === 'reject' && !reason) {
    res.status(400).json({ message: 'Rejection reason is required' });
    return;
  }

  try {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan application not found' });
      return;
    }

    if (loan.status !== 'APPLIED') {
      res.status(400).json({ message: `Cannot review loan in ${loan.status} status` });
      return;
    }

    if (action === 'approve') {
      loan.status = 'SANCTIONED';
    } else {
      loan.status = 'REJECTED';
      loan.rejectionReason = reason;
    }

    await loan.save();

    res.status(200).json({
      message: `Loan application successfully ${action}d.`,
      loan
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ==========================================
// 3. DISBURSEMENT MODULE (Funds Release)
// Access: Disbursement & Admin
// ==========================================
router.get('/disbursement/loans', requireRoles(['Disbursement']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'SANCTIONED' }).sort({ updatedAt: 1 });
    
    const detailedLoans = [];
    for (const loan of loans) {
      const borrower = await User.findById(loan.borrowerId).select('-passwordHash');
      const profile = await BorrowerProfile.findOne({ userId: loan.borrowerId });
      detailedLoans.push({
        loan,
        borrower,
        profile
      });
    }

    res.status(200).json(detailedLoans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/disbursement/disburse/:loanId', requireRoles(['Disbursement']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { loanId } = req.params;

  try {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'SANCTIONED') {
      res.status(400).json({ message: `Cannot disburse loan in ${loan.status} status` });
      return;
    }

    loan.status = 'DISBURSED';
    loan.disbursedAt = new Date();
    await loan.save();

    res.status(200).json({
      message: 'Loan disbursed successfully, funds released!',
      loan
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// ==========================================
// 4. COLLECTION MODULE (Recording Payments)
// Access: Collection & Admin
// ==========================================
router.get('/collection/loans', requireRoles(['Collection']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ status: 'DISBURSED' }).sort({ disbursedAt: 1 });
    
    const detailedLoans = [];
    for (const loan of loans) {
      const borrower = await User.findById(loan.borrowerId).select('-passwordHash');
      const profile = await BorrowerProfile.findOne({ userId: loan.borrowerId });
      const payments = await Payment.find({ loanId: loan._id }).sort({ createdAt: -1 });
      detailedLoans.push({
        loan,
        borrower,
        profile,
        payments
      });
    }

    res.status(200).json(detailedLoans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/collection/payment/:loanId', requireRoles(['Collection']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { loanId } = req.params;
  const { utr, amount, date } = req.body;

  if (!utr || amount === undefined) {
    res.status(400).json({ message: 'UTR and Payment Amount are required' });
    return;
  }

  const payAmount = Number(amount);
  if (payAmount <= 0) {
    res.status(400).json({ message: 'Payment amount must be greater than zero' });
    return;
  }

  // Start MongoDB Session for transactional integrity if possible, 
  // otherwise perform consecutive atomic validations.
  try {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ message: 'Loan not found' });
      return;
    }

    if (loan.status !== 'DISBURSED') {
      res.status(400).json({ message: `Cannot record payment for loan with status: ${loan.status}` });
      return;
    }

    // 1. Validate: Payment amount cannot exceed outstanding balance
    if (payAmount > loan.outstandingBalance) {
      res.status(400).json({ 
        message: `Payment amount ₹${payAmount} exceeds outstanding balance of ₹${loan.outstandingBalance}` 
      });
      return;
    }

    // 2. Validate: UTR must be unique across all payments
    const existingPayment = await Payment.findOne({ utr: utr.toUpperCase().trim() });
    if (existingPayment) {
      res.status(400).json({ message: `A payment with UTR ${utr} already exists` });
      return;
    }

    // 3. Create payment record
    const payment = new Payment({
      loanId: loan._id,
      utr: utr.toUpperCase().trim(),
      amount: payAmount,
      paymentDate: date ? new Date(date) : new Date(),
      recordedBy: req.user!._id
    });

    await payment.save();

    // 4. Update Outstanding Balance
    loan.outstandingBalance = Math.round((loan.outstandingBalance - payAmount) * 100) / 100;

    // 5. Auto close if balance is 0
    if (loan.outstandingBalance === 0) {
      loan.status = 'CLOSED';
    }

    await loan.save();

    res.status(201).json({
      message: loan.status === 'CLOSED' ? 'Payment recorded. Loan is now fully paid and CLOSED!' : 'Payment recorded successfully.',
      payment,
      loan
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/ops/payments/:loanId
// @desc    Get payment history for a specific loan
router.get('/payments/:loanId', requireRoles(['Collection', 'Sales', 'Sanction', 'Disbursement']), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ loanId: req.params.loanId }).sort({ createdAt: -1 });
    res.status(200).json(payments);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
