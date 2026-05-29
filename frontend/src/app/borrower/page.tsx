'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function BorrowerPortal() {
  const { user, token, loading, logout, apiFetch } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'Borrower') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Borrower flow states
  const [currentStep, setCurrentStep] = useState(1);
  const [fetchingData, setFetchingData] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [activeLoan, setActiveLoan] = useState<any>(null);

  // Step 2 Form States
  const [fullName, setFullName] = useState('');
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number>(30000);
  const [employmentMode, setEmploymentMode] = useState<'Salaried' | 'Self-Employed' | 'Unemployed'>('Salaried');
  
  // Step 3 File States
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Step 4 Loan Config States
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [loanTenure, setLoanTenure] = useState<number>(90); // in days

  // Error & Success UI feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [breErrors, setBreErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch initial profile & loans data
  const fetchData = async () => {
    setFetchingData(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Profile
      const profileData = await apiFetch('/borrower/profile').catch(() => null);
      if (profileData) {
        setProfile(profileData);
        setPan(profileData.pan || '');
        setMonthlySalary(profileData.monthlySalary || 30000);
        setEmploymentMode(profileData.employmentMode || 'Salaried');
        if (profileData.dob) {
          setDob(new Date(profileData.dob).toISOString().split('T')[0]);
        }
      }

      // 2. Fetch Loans
      const loanData = await apiFetch('/borrower/loan-status');
      setLoans(loanData);
      if (loanData && loanData.length > 0) {
        // Find if there is an active/incomplete loan
        const active = loanData.find((l: any) => ['APPLIED', 'SANCTIONED', 'DISBURSED'].includes(l.status));
        // Fallback to the latest one
        setActiveLoan(active || loanData[0]);
      } else {
        setActiveLoan(null);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sync portal details.');
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      setFullName(user.name);
      fetchData();
    }
  }, [user, token]);

  // Adjust steps based on profile status
  useEffect(() => {
    if (profile && !activeLoan) {
      if (profile.salarySlipUrl) {
        setCurrentStep(4);
      } else {
        setCurrentStep(3);
      }
    }
  }, [profile, activeLoan]);

  // MATH CALCULATOR: Simple Interest
  const rate = 12; // 12% p.a.
  const simpleInterest = Math.round((loanAmount * rate * loanTenure) / (365 * 100) * 100) / 100;
  const totalRepayment = loanAmount + simpleInterest;

  // STEP 2: Save Profile details & execute BRE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBreErrors([]);

    if (!pan || !dob || monthlySalary === undefined || !employmentMode) {
      setErrorMsg('Please complete all form fields');
      return;
    }

    // Client-side validations (Business Rule Engine mirroring)
    const clientErrors: string[] = [];

    // 1. Age check (between 23 and 50)
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      clientErrors.push('Invalid Date of Birth format.');
    } else {
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const monthDifference = today.getMonth() - dobDate.getMonth();
      if (
        monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < dobDate.getDate())
      ) {
        age--;
      }
      if (age < 23 || age > 50) {
        clientErrors.push(`Age must be between 23 and 50 years. Current calculated age is ${age}.`);
      }
    }

    // 2. Salary check (>= 25000)
    if (Number(monthlySalary) < 25000) {
      clientErrors.push('Monthly net salary must be at least ₹25,000.');
    }

    // 3. PAN validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.toUpperCase().trim())) {
      clientErrors.push('Invalid PAN card format. Format must match standard (e.g., ABCDE1234F).');
    }

    // 4. Employment mode validation
    if (employmentMode === 'Unemployed') {
      clientErrors.push('Employment status cannot be Unemployed.');
    }

    if (clientErrors.length > 0) {
      setBreErrors(clientErrors);
      return;
    }

    try {
      const result = await apiFetch('/borrower/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan,
          dob,
          monthlySalary,
          employmentMode,
        }),
      });

      setProfile(result.profile);
      setSuccessMsg('Details validated and approved by BRE engine!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setCurrentStep(3);
    } catch (err: any) {
      if (err.message.includes('BRE') || err.message.includes('Validation Failed')) {
        // Fetch BRE errors from API rejection
        const errorLines = err.message.split('\n');
        setBreErrors(errorLines.length > 0 ? errorLines : ['Business criteria mismatch']);
      } else {
        setErrorMsg(err.message || 'An error occurred during verification.');
      }
    }
  };

  // STEP 3: Handle Salary Slip Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUploadSlip = async () => {
    if (!file) {
      setErrorMsg('Please choose a file to upload');
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('salarySlip', file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/borrower/upload-slip`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setProfile({ ...profile, salarySlipUrl: data.salarySlipUrl });
      setSuccessMsg('Salary slip uploaded and verified!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setCurrentStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // STEP 4: Apply for Loan
  const handleApplyLoan = async () => {
    setErrorMsg(null);
    try {
      const result = await apiFetch('/borrower/apply-loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: loanAmount,
          tenure: loanTenure,
        }),
      });

      setSuccessMsg(result.message);
      setTimeout(() => setSuccessMsg(null), 4000);
      
      // Re-fetch to display Active Loan Status Tracker
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit application.');
    }
  };

  // Cancel / Restart application flow if rejected
  const handleReapply = () => {
    setActiveLoan(null);
    setCurrentStep(4); // Let them go to slider configuration again
  };

  if (loading || fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading borrower space...</p>
        </div>
      </div>
    );
  }

  // Active Loan Status Tracker Helper
  const getStatusNodeStyles = (stepStatus: string, loanStatus: string) => {
    const statusOrder = ['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'];
    const currentIdx = statusOrder.indexOf(loanStatus);
    const nodeIdx = statusOrder.indexOf(stepStatus);

    if (loanStatus === 'REJECTED') {
      if (stepStatus === 'APPLIED') return { text: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' };
      return { text: 'text-slate-600', bg: 'bg-slate-900 border-slate-800' };
    }

    if (nodeIdx < currentIdx) {
      // Completed steps
      return { text: 'text-teal-400', bg: 'bg-teal-500/20 border-teal-500/30' };
    } else if (nodeIdx === currentIdx) {
      // Active step
      return { text: 'text-cyan-400 font-bold scale-105 shadow-lg shadow-cyan-500/5', bg: 'bg-cyan-500/30 border-cyan-500/50 animate-pulse' };
    } else {
      // Future steps
      return { text: 'text-slate-500', bg: 'bg-slate-900 border-slate-800' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="font-extrabold text-slate-950 text-lg">CS</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              CreditSea
            </span>
            <span className="text-xs bg-slate-900 text-teal-400 px-2 py-0.5 rounded-full border border-slate-800">
              Borrower Portal
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden md:inline text-sm text-slate-400">
              Hello, <span className="text-white font-semibold">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-850 hover:text-rose-400 text-slate-300 border border-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        
        {/* Error Cards */}
        {errorMsg && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center space-x-3 shadow-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Business Rule Engine Error Rejections card */}
        {breErrors.length > 0 && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 shadow-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-rose-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2 2 2m0-4l-2 2-2-2m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-rose-400">Business Rule Engine (BRE) Rejection</h3>
                <p className="text-xs text-rose-350 mt-1">Our automated checks have rejected the eligibility request due to the following failures:</p>
                <ul className="list-disc list-inside mt-3 space-y-1.5 text-xs text-slate-300">
                  {breErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Success Card */}
        {successMsg && (
          <div className="mb-6 bg-teal-500/10 border border-teal-500/20 text-teal-400 p-4 rounded-xl text-sm flex items-center space-x-3 shadow-lg">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==========================================
            ACTIVE LOAN TRACKER (Shows after Apply)
            ========================================== */}
        {activeLoan ? (
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h2 className="text-xl md:text-2xl font-extrabold text-white mb-6">
              Track Your Loan Request
            </h2>

            {/* Visual Steps Tracker */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {['APPLIED', 'SANCTIONED', 'DISBURSED', 'CLOSED'].map((status) => {
                const styles = getStatusNodeStyles(status, activeLoan.status);
                return (
                  <div
                    key={status}
                    className={`p-4 border rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${styles.bg}`}
                  >
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${styles.text}`}>
                      {status === 'APPLIED' ? 'Pending Review' : status === 'SANCTIONED' ? 'Approved' : status === 'DISBURSED' ? 'Funds Disbursed' : 'Closed'}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 font-medium">{status}</span>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Status Details Card */}
            <div className="border border-slate-900 bg-slate-950/65 rounded-2xl p-6 mb-8 text-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-900">
                <span className="font-semibold text-slate-400">Loan Status</span>
                <span className={`px-3 py-1 text-xs font-extrabold rounded-full ${
                  activeLoan.status === 'APPLIED' ? 'bg-slate-900 border border-slate-800 text-teal-400' :
                  activeLoan.status === 'SANCTIONED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  activeLoan.status === 'DISBURSED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                  activeLoan.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {activeLoan.status}
                </span>
              </div>

              {activeLoan.status === 'REJECTED' && (
                <div className="bg-rose-500/5 border border-rose-500/10 text-rose-350 p-4 rounded-xl">
                  <span className="font-bold block mb-1">Rejection Details:</span>
                  <span>{activeLoan.rejectionReason || 'No comment provided by reviewer.'}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500">Principal Amount</span>
                  <p className="text-base font-bold text-white">₹{activeLoan.amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Tenure</span>
                  <p className="text-base font-bold text-white">{activeLoan.tenure} Days</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Interest rate (fixed)</span>
                  <p className="text-base font-bold text-white">{activeLoan.interestRate}% p.a.</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total Repayment Due</span>
                  <p className="text-base font-bold text-white">₹{activeLoan.totalRepayment.toLocaleString()}</p>
                </div>
              </div>

              {activeLoan.status === 'DISBURSED' && (
                <div className="bg-teal-500/5 border border-teal-500/10 text-teal-350 p-4 rounded-xl flex flex-col space-y-2 mt-4">
                  <div className="flex justify-between">
                    <span className="font-bold text-xs text-teal-400 uppercase tracking-wider">Outstanding Balance:</span>
                    <span className="font-extrabold text-sm text-teal-300">₹{activeLoan.outstandingBalance.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-slate-400 leading-relaxed">
                    💡 Repayments can be collected by bank transfer. Submit your payment receipt & UTR reference code to the Collections Executive to clear your balance and close this loan.
                  </span>
                </div>
              )}
            </div>

            {/* Back Actions */}
            {activeLoan.status === 'REJECTED' && (
              <button
                onClick={handleReapply}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
              >
                Start New Application
              </button>
            )}

            {activeLoan.status === 'CLOSED' && (
              <button
                onClick={handleReapply}
                className="w-full py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-teal-400 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
              >
                Apply for Another Loan
              </button>
            )}
          </div>
        ) : (
          /* ==========================================
              MULTI-STEP APPLICATION FORM
              ========================================== */
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Step Progress indicators */}
            <div className="flex items-center justify-between mb-10 border-b border-slate-900 pb-6 overflow-x-auto whitespace-nowrap">
              {[
                { number: 1, title: 'Auth Verified' },
                { number: 2, title: 'Details' },
                { number: 3, title: 'Salary Slip' },
                { number: 4, title: 'Config & Apply' },
              ].map((step) => (
                <div key={step.number} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
                    currentStep === step.number
                      ? 'bg-teal-500/20 text-teal-400 border-teal-500/60'
                      : currentStep > step.number
                      ? 'bg-teal-500 text-slate-950 border-teal-500'
                      : 'bg-slate-950 text-slate-600 border-slate-900'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className={`text-xs font-medium ${
                    currentStep === step.number ? 'text-teal-400' : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>

            {/* ==================== STEP 1 ==================== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Start Loan Application</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Applying takes about 5 minutes. You will need your PAN card details, employment monthly records, and a salary slip file (PDF or Image).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/60 text-sm space-y-2">
                  <p className="text-slate-400">Authenticated profile details:</p>
                  <p className="font-bold text-white">Name: {user?.name}</p>
                  <p className="font-bold text-white">Email: {user?.email}</p>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
                >
                  Proceed to Personal Details
                </button>
              </div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {currentStep === 2 && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Step 2: Personal Details</h2>
                  <p className="text-slate-400 text-xs">Verify your data. Rejection rules will validate parameters in our BRE.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Full Name (As in records)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={fullName}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-500 text-sm focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                      PAN Card Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                      Monthly Net Salary (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={monthlySalary}
                      onChange={(e) => setMonthlySalary(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                      Employment Status
                    </label>
                    <select
                      value={employmentMode}
                      onChange={(e) => setEmploymentMode(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
                    >
                      <option value="Salaried">Salaried</option>
                      <option value="Self-Employed">Self-Employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-1/3 py-3 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-slate-300 text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
                  >
                    Validate Eligibility
                  </button>
                </div>
              </form>
            )}

            {/* ==================== STEP 3 ==================== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Step 3: Salary Slip Upload</h2>
                  <p className="text-slate-400 text-xs">Verify your net earnings. Upload PDF/JPG/PNG files up to 5MB.</p>
                </div>

                {/* Drag Drop File Upload Component */}
                <div className="border-2 border-dashed border-slate-800 hover:border-teal-500/40 rounded-2xl p-8 text-center bg-slate-950/40 transition-all relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/5 mx-auto flex items-center justify-center border border-teal-500/10">
                      <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    {file ? (
                      <div>
                        <p className="text-sm font-bold text-white truncate max-w-xs mx-auto">{file.name}</p>
                        <p className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold text-slate-300">Drag & drop your salary slip or click to browse</p>
                        <p className="text-[10px] text-slate-500 mt-1">Accepts PDF, JPG, PNG up to 5 MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-1/3 py-3 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-slate-300 text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadSlip}
                    disabled={uploading || !file}
                    className="w-2/3 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm disabled:opacity-40"
                  >
                    {uploading ? 'Uploading slip...' : 'Upload Slip & Proceed'}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== STEP 4 ==================== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Configure Loan Parameters</h2>
                  <p className="text-slate-400 text-xs">Pick your principal amount and payback term. Interest is fixed at 12% p.a.</p>
                </div>

                <div className="space-y-6">
                  {/* Slider 1: Loan Amount */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-bold">
                      <span>Loan Amount</span>
                      <span className="text-teal-400 font-extrabold text-base">₹{loanAmount.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={500000}
                      step={10000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>₹50K</span>
                      <span>₹5L</span>
                    </div>
                  </div>

                  {/* Slider 2: Tenure */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-bold">
                      <span>Tenure Length</span>
                      <span className="text-teal-400 font-extrabold text-base">{loanTenure} Days</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={365}
                      step={1}
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(Number(e.target.value))}
                      className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>30 Days</span>
                      <span>365 Days</span>
                    </div>
                  </div>
                </div>

                {/* Calculation breakdown board */}
                <div className="border border-slate-900 bg-slate-950/65 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-900">
                    Live Calculation breakdown
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Principal Requested</span>
                    <span className="text-white font-semibold">₹{loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Interest rate</span>
                    <span className="text-white font-semibold">12% p.a.</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Simple Interest calculated</span>
                    <span className="text-teal-400 font-semibold">+ ₹{simpleInterest.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-900">
                    <span className="text-slate-400">Total Repayment Amount</span>
                    <span className="text-white bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                      ₹{totalRepayment.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="w-1/3 py-3 border border-slate-800 hover:border-slate-700 rounded-xl font-bold text-slate-300 text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyLoan}
                    className="w-2/3 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg cursor-pointer transition-all text-sm"
                  >
                    Confirm & Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
