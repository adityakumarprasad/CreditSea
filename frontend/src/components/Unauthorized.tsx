'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Unauthorized({ requiredRoles }: { requiredRoles?: string[] }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleGoBack = () => {
    if (user) {
      if (user.role === 'Borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full bg-slate-900/40 border border-slate-900 rounded-3xl p-8 text-center backdrop-blur-md relative overflow-hidden shadow-2xl">
        {/* Background glow decoration */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

        {/* Lock SVG Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-rose-455" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">Access Denied</h2>
        <span className="inline-block text-[10px] uppercase font-bold text-rose-450 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 mb-4">
          403 - Forbidden
        </span>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Your current account role <span className="text-white font-semibold">({user?.role || 'Guest'})</span> does not have authorization to view this module.
          {requiredRoles && (
            <span className="block mt-2 text-xs text-slate-500">
              Required access level: {requiredRoles.join(' or ')}
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoBack}
            className="w-full sm:w-1/2 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-500/5 cursor-pointer transition-all active:scale-95"
          >
            Back to Workspace
          </button>
          <button
            onClick={logout}
            className="w-full sm:w-1/2 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95"
          >
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
}
