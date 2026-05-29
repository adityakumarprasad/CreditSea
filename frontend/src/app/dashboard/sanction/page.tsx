'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function SanctionReviews() {
  const { apiFetch, user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track open rejection reason boxes per loan
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/ops/sanction/loans');
      setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pending applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Sanction' || user.role === 'Admin')) {
      fetchLoans();
    }
  }, [user]);

  const handleReview = async (loanId: string, action: 'approve' | 'reject') => {
    const reason = rejectionReasons[loanId];

    if (action === 'reject' && !reason?.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setError(null);
    setActioningId(loanId);

    try {
      await apiFetch(`/ops/sanction/review/${loanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: action === 'reject' ? reason : undefined,
        }),
      });

      // Remove the actioned loan from display list
      setLoans(loans.filter((l) => l.loan._id !== loanId));
      
      // Clear specific form inputs
      setRejectionReasons((prev) => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
      setShowRejectForm((prev) => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setActioningId(null);
    }
  };

  // Restrict access client-side
  if (user && user.role !== 'Sanction' && user.role !== 'Admin') {
    return (
      <div className="p-8 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-2xl">
        <h2 className="font-bold text-lg">403 - Forbidden</h2>
        <p className="text-sm mt-1">You do not have permissions to access the Sanction Review Desk.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Sanction Review Desk</h1>
          <p className="text-slate-400 text-sm">
            Inspect pending borrower applications, verify financial details, and approve or reject.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
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
          <p className="text-slate-500 text-xs">Querying pending loan applications...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/20">
          <p className="text-slate-400 text-sm font-medium">No pending loan applications to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map(({ loan, borrower, profile }) => (
            <div
              key={loan._id}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 relative overflow-hidden space-y-6"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Borrower: {borrower?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-slate-500">{borrower?.email}</p>
                </div>
                
                {/* Configuration parameters */}
                <div className="grid grid-cols-3 gap-x-6 gap-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-900 text-xs">
                  <div>
                    <span className="text-slate-500 block">Requested</span>
                    <span className="font-bold text-white">₹{loan.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tenure</span>
                    <span className="font-bold text-white">{loan.tenure} days</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Repayment</span>
                    <span className="font-bold text-teal-400">₹{loan.totalRepayment.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Profile specifications */}
              {profile ? (
                <div className="pt-4 border-t border-slate-900/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-950/20 p-4 rounded-xl">
                  <div>
                    <span className="text-slate-550 block">PAN</span>
                    <span className="font-bold text-slate-300 uppercase">{profile.pan}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Monthly Salary</span>
                    <span className="font-bold text-slate-300">₹{profile.monthlySalary.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Employment Mode</span>
                    <span className="font-bold text-slate-300">{profile.employmentMode}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Salary Slip</span>
                    {profile.salarySlipUrl ? (
                      <a
                        href={`http://localhost:5000${profile.salarySlipUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 hover:text-teal-350 underline font-bold"
                      >
                        Download PDF/Image
                      </a>
                    ) : (
                      <span className="text-rose-400 font-semibold">Missing File</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-500/5 text-xs text-rose-400 rounded-xl italic">
                  Warning: No borrower profile details found for this user!
                </div>
              )}

              {/* Action Operations */}
              <div className="flex flex-col space-y-4 pt-2">
                {!showRejectForm[loan._id] ? (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleReview(loan._id, 'approve')}
                      disabled={actioningId !== null}
                      className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Approve & Sanction
                    </button>
                    <button
                      onClick={() => setShowRejectForm((prev) => ({ ...prev, [loan._id]: true }))}
                      disabled={actioningId !== null}
                      className="w-1/2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 p-4 border border-slate-900 rounded-xl space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase">
                      Enter Rejection Reason
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReasons[loan._id] || ''}
                      onChange={(e) =>
                        setRejectionReasons((prev) => ({ ...prev, [loan._id]: e.target.value }))
                      }
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500/50"
                      placeholder="Applicant has insufficient history / document mismatch..."
                    />
                    <div className="flex space-x-2 justify-end text-xs">
                      <button
                        onClick={() => setShowRejectForm((prev) => ({ ...prev, [loan._id]: false }))}
                        className="px-3 py-1.5 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReview(loan._id, 'reject')}
                        disabled={actioningId !== null}
                        className="px-4 py-1.5 bg-rose-500 hover:bg-rose-455 text-slate-950 font-bold rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        Submit Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
