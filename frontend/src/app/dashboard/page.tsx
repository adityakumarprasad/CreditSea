'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DashboardHome() {
  const { user } = useAuth();
  const router = useRouter();

  // Proactively redirect singular roles to their specific modules, Admin stays to see overview
  useEffect(() => {
    if (user && user.role !== 'Admin') {
      const paths: Record<string, string> = {
        Sales: '/dashboard/sales',
        Sanction: '/dashboard/sanction',
        Disbursement: '/dashboard/disbursement',
        Collection: '/dashboard/collection',
      };
      if (paths[user.role]) {
        router.push(paths[user.role]);
      }
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Operations Workspace</h1>
        <p className="text-slate-400 text-sm">
          Welcome back, <span className="text-white font-bold">{user.name}</span>. Access operations panels using sidebar links or the navigation maps below.
        </p>
      </div>

      {user.role === 'Admin' && (
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {[
            {
              title: 'Sales Lead Tracker',
              desc: 'Monitor registered users in the pre-application pipeline.',
              link: '/dashboard/sales',
              color: 'border-sky-500/20 hover:border-sky-500/40 text-sky-400',
            },
            {
              title: 'Sanction Review Desk',
              desc: 'Approve or reject pending loan applications with detailed comments.',
              link: '/dashboard/sanction',
              color: 'border-amber-500/20 hover:border-amber-500/40 text-amber-400',
            },
            {
              title: 'Disbursement Hub',
              desc: 'Release cleared funds and flag loan accounts as active.',
              link: '/dashboard/disbursement',
              color: 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400',
            },
            {
              title: 'Collection Ledger',
              desc: 'Post payments, verify UTR codes, and monitor outstanding balances.',
              link: '/dashboard/collection',
              color: 'border-rose-500/20 hover:border-rose-500/40 text-rose-400',
            },
          ].map((card) => (
            <Link
              key={card.link}
              href={card.link}
              className={`p-6 rounded-2xl border bg-slate-900/30 hover:bg-slate-900/50 transition-all cursor-pointer group flex flex-col justify-between h-40 ${card.color}`}
            >
              <div>
                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-teal-400 transition-colors">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">{card.desc}</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider flex items-center space-x-1 mt-4">
                <span>Enter Module</span>
                <span>→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
