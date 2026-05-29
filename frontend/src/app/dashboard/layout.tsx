'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'Borrower') {
        router.push('/borrower');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role === 'Borrower') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Authorizing credentials...</p>
        </div>
      </div>
    );
  }

  // Define sidebar navigation based on role
  const navItems = [
    {
      name: 'Sales (Leads)',
      path: '/dashboard/sales',
      roles: ['Sales', 'Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Sanction (Reviews)',
      path: '/dashboard/sanction',
      roles: ['Sanction', 'Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Disbursement (Payouts)',
      path: '/dashboard/disbursement',
      roles: ['Disbursement', 'Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Collection (Payments)',
      path: '/dashboard/collection',
      roles: ['Collection', 'Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
        </svg>
      ),
    },
  ];

  const visibleNavItems = navItems.filter(
    (item) => user.role === 'Admin' || item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-900 flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="font-extrabold text-slate-950 text-base">CS</span>
          </div>
          <span className="font-bold text-lg text-white">CreditSea Ops</span>
        </div>

        {/* Profile Card */}
        <div className="p-4 mx-4 my-6 rounded-xl border border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <span className="inline-block text-[10px] uppercase font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full mt-0.5">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-grow px-4 space-y-1">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 text-teal-400 border border-teal-500/25'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-white border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-bold text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto bg-slate-950 p-8 md:p-12 relative">
        {/* Background glow decoration */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
