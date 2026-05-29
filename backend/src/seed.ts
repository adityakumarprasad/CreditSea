import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User';
import BorrowerProfile from './models/BorrowerProfile';
import Loan from './models/Loan';
import Payment from './models/Payment';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/creditsea';

const seedUsers = [
  {
    name: 'CreditSea Admin',
    email: 'admin@creditsea.com',
    password: 'Admin@123',
    role: 'Admin',
  },
  {
    name: 'Sales Executive',
    email: 'sales@creditsea.com',
    password: 'Sales@123',
    role: 'Sales',
  },
  {
    name: 'Sanction Executive',
    email: 'sanction@creditsea.com',
    password: 'Sanction@123',
    role: 'Sanction',
  },
  {
    name: 'Disbursement Executive',
    email: 'disburse@creditsea.com',
    password: 'Disburse@123',
    role: 'Disbursement',
  },
  {
    name: 'Collection Executive',
    email: 'collect@creditsea.com',
    password: 'Collect@123',
    role: 'Collection',
  },
  {
    name: 'John Borrower',
    email: 'borrower@creditsea.com',
    password: 'Borrower@123',
    role: 'Borrower',
  },
];

const runSeeder = async () => {
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Wipe database collections
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await BorrowerProfile.deleteMany({});
    await Loan.deleteMany({});
    await Payment.deleteMany({});
    console.log('Collections cleared.');

    // 2. Hash passwords and insert seed users
    console.log('Seeding users...');
    for (const u of seedUsers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(u.password, salt);

      const newUser = new User({
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
      });

      await newUser.save();
      console.log(`Created User: ${u.email} [Role: ${u.role}] (Password: ${u.password})`);
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
};

runSeeder();
