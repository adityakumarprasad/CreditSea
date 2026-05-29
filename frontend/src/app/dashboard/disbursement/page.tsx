'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DisbursementHub() {
  const { apiFetch, user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/ops/disbursement/loans');
      setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sanctioned loans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Disbursement' || user.role === 'Admin')) {
      fetchLoans();
    }
  }, [user]);

  const handleDisburse = async (loanId: string) => {
    setError(null);
    setActioningId(loanId);

    try {
      await apiFetch(`/ops/disbursement/disburse/${loanId}`, {
        method: 'POST',
      });

      // Remove disbursed loan from display list
      setLoans(loans.filter((l) => l.loan._id !== loanId));
    } catch (err: any) {
      setError(err.message || 'Disbursement action failed.');
    } finally {
      setActioningId(null);
    }
  };

  // Restrict access client-side
  if (user && user.role !== 'Disbursement' && user.role !== 'Admin') {
    return (
      <div className="p-8 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-2xl">
        <h2 className="font-bold text-lg">403 - Forbidden</h2>
        <p className="text-sm mt-1">You do not have permissions to access the Disbursement Hub.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Disbursement Hub</h1>
          <p className="text-slate-400 text-sm">
            Approve disbursement of funds for sanctioned loans, marking them as active.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          title="Refresh Sanctioned Loans"
          className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center space-x-3">
          <span>⚠️ {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs">Querying sanctioned loans...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/20">
          <p className="text-slate-400 text-sm font-medium">No sanctioned loans awaiting disbursement.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map(({ loan, borrower }) => (
            <div
              key={loan._id}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6"
            >
              <div className="space-y-2">
                <span className="inline-block text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Approved
                </span>
                <h3 className="font-bold text-white text-base">
                  Borrower: {borrower?.name || 'Unknown'}
                </h3>
                <p className="text-xs text-slate-500">{borrower?.email}</p>
              </div>

              {/* Sanctioned values */}
              <div className="grid grid-cols-3 gap-6 bg-slate-950/45 p-4 rounded-xl border border-slate-900 text-xs text-center">
                <div>
                  <span className="text-slate-500 block">Principal</span>
                  <span className="font-extrabold text-white">₹{loan.amount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Term</span>
                  <span className="font-extrabold text-white">{loan.tenure} days</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Due</span>
                  <span className="font-extrabold text-teal-400">₹{loan.totalRepayment.toLocaleString()}</span>
                </div>
              </div>

              {/* Disburse Action */}
              <div className="flex items-center min-w-44">
                <button
                  onClick={() => handleDisburse(loan._id)}
                  disabled={actioningId !== null}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-500/5 cursor-pointer transition-all"
                >
                  {actioningId === loan._id ? (
                    <span className="flex items-center justify-center space-x-1.5">
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Releasing...</span>
                    </span>
                  ) : (
                    'Disburse Funds'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
