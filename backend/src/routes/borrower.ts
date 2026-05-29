import { Router, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { authenticateToken, AuthenticatedRequest, requireRoles } from '../middlewares/auth';
import BorrowerProfile from '../models/BorrowerProfile';
import Loan from '../models/Loan';
import { runBRE } from '../utils/bre';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PDF, JPG, and PNG files up to 5MB are allowed!'));
  },
});

// Guard all borrower routes to only logged in Borrowers (or Admin)
router.use(authenticateToken);
router.use(requireRoles(['Borrower']));

// @route   GET /api/borrower/profile
// @desc    Get current borrower's profile
router.get('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const profile = await BorrowerProfile.findOne({ userId: req.user!._id });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }
    res.status(200).json(profile);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/borrower/profile
// @desc    Create or update personal details & run BRE checks
router.post('/profile', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { pan, dob, monthlySalary, employmentMode } = req.body;

  if (!pan || !dob || monthlySalary === undefined || !employmentMode) {
    res.status(400).json({ message: 'All personal details fields are required' });
    return;
  }

  // Run Business Rule Engine (BRE)
  const breResult = runBRE({
    dob,
    monthlySalary,
    pan,
    employmentMode,
  });

  if (!breResult.isValid) {
    res.status(400).json({
      message: 'Business Rule Engine (BRE) Validation Failed',
      errors: breResult.errors,
    });
    return;
  }

  try {
    let profile = await BorrowerProfile.findOne({ userId: req.user!._id });
    if (profile) {
      profile.pan = pan.toUpperCase().trim();
      profile.dob = new Date(dob);
      profile.monthlySalary = monthlySalary;
      profile.employmentMode = employmentMode;
      await profile.save();
    } else {
      profile = new BorrowerProfile({
        userId: req.user!._id,
        pan: pan.toUpperCase().trim(),
        dob: new Date(dob),
        monthlySalary,
        employmentMode,
      });
      await profile.save();
    }

    res.status(200).json({
      message: 'Profile saved successfully and passed BRE check!',
      profile,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/borrower/upload-slip
// @desc    Upload salary slip file
router.post('/upload-slip', (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  upload.single('salarySlip')(req, res, async (err: any) => {
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Please upload a file' });
      return;
    }

    try {
      let profile = await BorrowerProfile.findOne({ userId: req.user!._id });
      if (!profile) {
        res.status(400).json({ message: 'Please complete personal details (Step 2) before uploading slip.' });
        return;
      }

      // Store relative path
      const salarySlipUrl = `/uploads/${req.file.filename}`;
      profile.salarySlipUrl = salarySlipUrl;
      await profile.save();

      res.status(200).json({
        message: 'Salary slip uploaded successfully!',
        salarySlipUrl,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });
});

// @route   POST /api/borrower/apply-loan
// @desc    Apply for a loan (Live calculator variables verified on server)
router.post('/apply-loan', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { amount, tenure } = req.body;

  if (!amount || !tenure) {
    res.status(400).json({ message: 'Amount and tenure are required' });
    return;
  }

  const numAmount = Number(amount);
  const numTenure = Number(tenure);

  if (numAmount < 50000 || numAmount > 500000) {
    res.status(400).json({ message: 'Loan amount must be between ₹50,000 and ₹5,000,000.' });
    return;
  }

  if (numTenure < 30 || numTenure > 365) {
    res.status(400).json({ message: 'Loan tenure must be between 30 and 365 days.' });
    return;
  }

  try {
    // 1. Verify profile is complete
    const profile = await BorrowerProfile.findOne({ userId: req.user!._id });
    if (!profile || !profile.salarySlipUrl) {
      res.status(400).json({ message: 'Please complete personal details and upload your salary slip before applying.' });
      return;
    }

    // 2. Verify no active/pending loans exist
    const activeLoan = await Loan.findOne({
      borrowerId: req.user!._id,
      status: { $in: ['APPLIED', 'SANCTIONED', 'DISBURSED'] },
    });

    if (activeLoan) {
      res.status(400).json({ message: 'You already have an active or pending loan application.' });
      return;
    }

    // 3. Compute loan math (Simple Interest)
    // SI = (P * R * T) / (365 * 100)
    const rate = 12; // 12% p.a.
    const simpleInterest = Math.round((numAmount * rate * numTenure) / (365 * 100) * 100) / 100;
    const totalRepayment = numAmount + simpleInterest;

    const newLoan = new Loan({
      borrowerId: req.user!._id,
      amount: numAmount,
      tenure: numTenure,
      interestRate: rate,
      simpleInterest,
      totalRepayment,
      outstandingBalance: totalRepayment,
      status: 'APPLIED',
    });

    await newLoan.save();

    res.status(201).json({
      message: 'Loan application submitted successfully!',
      loan: newLoan,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/borrower/loan-status
// @desc    Get status of borrower's loans
router.get('/loan-status', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const loans = await Loan.find({ borrowerId: req.user!._id }).sort({ createdAt: -1 });
    res.status(200).json(loans);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
