import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'creditsea_jwt_secret_987654321_abcdef';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// @route   POST /api/auth/register
// @desc    Register a user (Default Borrower role)
router.post('/register', async (req: any, res: Response): Promise<void> => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole: UserRole = role && ['Admin', 'Sales', 'Sanction', 'Disbursement', 'Collection', 'Borrower'].includes(role)
      ? (role as UserRole)
      : 'Borrower';

    const newUser = new User({
      name,
      email,
      passwordHash,
      role: userRole,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT
router.post('/login', async (req: any, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

export default router;
