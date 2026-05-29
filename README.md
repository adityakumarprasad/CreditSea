# CreditSea - Loan Management System

CreditSea is a full-stack digital lending platform that handles the entire loan lifecycle. It features a multi-step **Borrower Portal** for submitting loan requests and an **Operations Dashboard** with role-based access control (RBAC) modules for backend executives.

---

## ⚡ Quick Start: Seed Credentials

For immediate testing, use the pre-seeded credentials below:

| Role | Email | Password | Allowed Module Access |
| :--- | :--- | :--- | :--- |
| **Borrower** | `borrower@creditsea.com` | `Borrower@123` | Borrower Application Form & Loan Tracker |
| **Sales** | `sales@creditsea.com` | `Sales@123` | Sales Lead Tracking Module |
| **Sanction** | `sanction@creditsea.com` | `Sanction@123` | Sanction Approval/Rejection Module |
| **Disbursement** | `disburse@creditsea.com` | `Disburse@123` | Disbursement Funds Release Module |
| **Collection** | `collect@creditsea.com` | `Collect@123` | Collection ledger / Payment recording |
| **Admin** | `admin@creditsea.com` | `Admin@123` | **All** Operations modules |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth & Security**: JSON Web Tokens (JWT) + bcryptjs

---

## 📂 Project Structure

```
creditSea/
├── backend/
│   ├── src/
│   │   ├── middlewares/  # Authentication & RBAC middleware
│   │   ├── models/       # Mongoose Schemas (User, BorrowerProfile, Loan, Payment)
│   │   ├── routes/       # API endpoints (auth, borrower, operations)
│   │   ├── utils/        # Business Rule Engine (BRE) checks
│   │   ├── seed.ts       # Database seeder script
│   │   └── server.ts     # Express entry point
│   ├── .env.example
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── app/          # Next.js pages and layouts
    │   └── context/      # React AuthContext state provider
    └── package.json
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** (Running locally on `mongodb://127.0.0.1:27017/creditsea` or a cloud Atlas URI)

---

### 2. Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Run the database seed script:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server starts on `http://localhost:5000`.*

---

### 3. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The client app will launch at `http://localhost:3000`.*

---

## 💡 System Design Details

### 1. Business Rule Engine (BRE)
The BRE runs securely on the Express server (`backend/src/utils/bre.ts`) to validate borrower eligibility:
- **Age Validation**: Rejects applicants not aged between `23` and `50` (calculated dynamically from DOB).
- **Salary Check**: Rejects borrowers earning less than `₹25,000` per month.
- **PAN Verification**: Validates the PAN format using regex `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`.
- **Employment Check**: Rejects candidates marked as `Unemployed`.

*Client-side inputs display clear, responsive error layouts listing failed rules on BRE rejection.*

### 2. Role-Based Access Control (RBAC)
- Enforced at the **UI Layer** via dynamic Next.js layout structures, rendering navigation lists relative to the user's role.
- Enforced at the **API Layer** using middleware (`backend/src/middlewares/auth.ts`). Attempts by unauthorized accounts to call restricted endpoints return `403 Forbidden`.

### 3. Loan Math & Concurrency
- **Interest**: Simple Interest is computed using:
  $$\text{Simple Interest} = \frac{P \times R \times T}{365 \times 100}$$
  *Where P = Principal, R = 12% fixed rate, and T = Tenure in days.*
- **Financial Precision**: Floating-point precision errors are mitigated in JavaScript by rounding intermediate values to 2 decimal places using math multipliers, preventing fractional pennies/paise mismatch.
- **UTR Uniqueness**: Enforced via MongoDB unique indexing on the `utr` field inside the payments schema, eliminating duplicate transaction claims.
