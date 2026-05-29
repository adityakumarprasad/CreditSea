'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const demoAccounts = [
  { role: 'Borrower', email: 'borrower@creditsea.com', pass: 'Borrower@123', color: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
  { role: 'Sales', email: 'sales@creditsea.com', pass: 'Sales@123', color: 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/20' },
  { role: 'Sanction', email: 'sanction@creditsea.com', pass: 'Sanction@123', color: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' },
  { role: 'Disburse', email: 'disburse@creditsea.com', pass: 'Disburse@123', color: 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/20' },
  { role: 'Collection', email: 'collect@creditsea.com', pass: 'Collect@123', color: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20' },
  { role: 'Admin', email: 'admin@creditsea.com', pass: 'Admin@123', color: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-violet-500/20' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect based on role
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'Borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please try again.');
      }

      login(data.token, data.user);
      
      // Redirect based on role
      if (data.user.role === 'Borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Server error. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Verifying active session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="font-extrabold text-slate-950 text-base">CS</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              CreditSea
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link href="/register" className="font-medium text-teal-400 hover:text-teal-300 transition-colors">
            register as a new borrower
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/60 backdrop-blur-md py-8 px-4 shadow-2xl rounded-2xl border border-slate-900 sm:px-10">
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm placeholder-slate-650 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-sm placeholder-slate-650 text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-slate-950 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Seeder Credentials Helper */}
          <div className="mt-8 border-t border-slate-900 pt-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              ⚡ Evaluator Testing Quick-Fill Accounts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  onClick={() => handleDemoFill(account.email, account.pass)}
                  className={`text-left p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-150 flex flex-col ${account.color}`}
                >
                  <span className="font-bold">{account.role}</span>
                  <span className="opacity-70 text-[10px] truncate">{account.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
