'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function CollectionLedger() {
  const { apiFetch, user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states per loan
  const [utrInputs, setUtrInputs] = useState<Record<string, string>>({});
  const [amountInputs, setAmountInputs] = useState<Record<string, number>>({});
  const [showPaymentForm, setShowPaymentForm] = useState<Record<string, boolean>>({});
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/ops/collection/loans');
      setLoans(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collection logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Collection' || user.role === 'Admin')) {
      fetchLoans();
    }
  }, [user]);

  const handleRecordPayment = async (loanId: string, outstanding: number) => {
    const utr = utrInputs[loanId];
    const amount = amountInputs[loanId];

    if (!utr?.trim() || !amount) {
      setError('Please provide a unique UTR number and a positive payment amount.');
      return;
    }

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (amount > outstanding) {
      setError(`Payment amount ₹${amount} cannot exceed outstanding balance of ₹${outstanding}.`);
      return;
    }

    setError(null);
    setSuccess(null);
    setActioningId(loanId);

    try {
      const response = await apiFetch(`/ops/collection/payment/${loanId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utr,
          amount,
        }),
      });

      setSuccess(response.message || 'Payment recorded successfully!');
      setTimeout(() => setSuccess(null), 4000);

      // Reset specific forms
      setUtrInputs((prev) => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
      setAmountInputs((prev) => {
        const copy = { ...prev };
        delete copy[loanId];
        return copy;
      });
      setShowPaymentForm((prev) => ({ ...prev, [loanId]: false }));

      // Refresh list to update outstanding balances and remove closed loans
      fetchLoans();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment.');
    } finally {
      setActioningId(null);
    }
  };

  // Restrict access client-side
  if (user && user.role !== 'Collection' && user.role !== 'Admin') {
    return (
      <div className="p-8 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-2xl">
        <h2 className="font-bold text-lg">403 - Forbidden</h2>
        <p className="text-sm mt-1">You do not have permissions to access the Collection Ledger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Collection Ledger</h1>
          <p className="text-slate-400 text-sm">
            Manage active disbursed loans, record borrower repayments, and verify bank UTR references.
          </p>
        </div>
        <button
          onClick={fetchLoans}
          title="Refresh Ledger"
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

      {success && (
        <div className="bg-teal-500/10 border border-teal-500/20 text-teal-400 p-4 rounded-xl text-sm flex items-center space-x-3">
          <span>✓ {success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-xs">Querying active ledger accounts...</p>
        </div>
      ) : loans.length === 0 ? (
        <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/20">
          <p className="text-slate-400 text-sm font-medium">No active disbursed loans found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {loans.map(({ loan, borrower, payments }) => (
            <div
              key={loan._id}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 space-y-6 relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-white text-base">
                    Borrower: {borrower?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-slate-500">{borrower?.email}</p>
                </div>

                {/* Ledger metrics */}
                <div className="grid grid-cols-3 gap-6 bg-slate-950/45 p-4 rounded-xl border border-slate-900 text-xs text-center">
                  <div>
                    <span className="text-slate-550 block">Sanctioned</span>
                    <span className="font-extrabold text-white">₹{loan.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Total Repayable</span>
                    <span className="font-extrabold text-slate-300">₹{loan.totalRepayment.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-550 block">Outstanding</span>
                    <span className="font-extrabold text-teal-400">₹{loan.outstandingBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payments History section */}
              <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-900 text-xs space-y-3">
                <span className="font-bold text-slate-400 uppercase tracking-wider block">
                  Payment History
                </span>
                
                {payments && payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-550 pb-2">
                          <th className="font-semibold py-2">Date</th>
                          <th className="font-semibold py-2">UTR Number</th>
                          <th className="font-semibold py-2 text-right">Amount Received</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/40">
                        {payments.map((p: any) => (
                          <tr key={p._id} className="text-slate-300">
                            <td className="py-2">
                              {new Date(p.paymentDate).toLocaleDateString()}
                            </td>
                            <td className="py-2 uppercase font-mono">{p.utr}</td>
                            <td className="py-2 text-right font-bold">₹{p.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <span className="text-slate-550 italic block">No payments recorded yet.</span>
                )}
              </div>

              {/* Record Payment UI Toggle */}
              <div className="pt-2">
                {!showPaymentForm[loan._id] ? (
                  <button
                    onClick={() => setShowPaymentForm((prev) => ({ ...prev, [loan._id]: true }))}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-850 hover:border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Record Received Payment
                  </button>
                ) : (
                  <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900 space-y-4">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                      New Payment Entry
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-450 uppercase mb-2">
                          UTR / Reference Number (Unique)
                        </label>
                        <input
                          type="text"
                          required
                          value={utrInputs[loan._id] || ''}
                          onChange={(e) =>
                            setUtrInputs((prev) => ({ ...prev, [loan._id]: e.target.value.toUpperCase() }))
                          }
                          placeholder="Bank UTR Number"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-450 uppercase mb-2">
                          Amount Received (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={loan.outstandingBalance}
                          value={amountInputs[loan._id] || ''}
                          onChange={(e) =>
                            setAmountInputs((prev) => ({ ...prev, [loan._id]: Number(e.target.value) }))
                          }
                          placeholder="e.g. 50000"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/10"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 text-xs pt-2">
                      <button
                        onClick={() => setShowPaymentForm((prev) => ({ ...prev, [loan._id]: false }))}
                        className="px-3 py-1.5 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleRecordPayment(loan._id, loan.outstandingBalance)}
                        disabled={actioningId !== null}
                        className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-lg disabled:opacity-40 cursor-pointer"
                      >
                        {actioningId === loan._id ? 'Saving Entry...' : 'Save Transaction'}
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
