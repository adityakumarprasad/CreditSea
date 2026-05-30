import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load Environment variables
dotenv.config();

import authRoutes from './routes/auth';
import borrowerRoutes from './routes/borrower';
import opsRoutes from './routes/ops';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/creditsea';

// Middlewares
app.use(cors({
  origin: true, // Dynamically reflects requesting origin back, allowing credentials securely
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/ops', opsRoutes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'CreditSea API is running smoothly' });
});

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
