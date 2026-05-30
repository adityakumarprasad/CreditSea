'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE_URL } from '@/context/AuthContext';
import Unauthorized from '@/components/Unauthorized';

const getFileUrl = (url: string) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const root = API_BASE_URL.replace(/\/api$/, '');
  return `${root}${url}`;
};


export default function SalesLeads() {
  const { apiFetch, user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/ops/sales/leads');
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Sales' || user.role === 'Admin')) {
      fetchLeads();
    }
  }, [user]);

  // Restrict access client-side
  if (user && user.role !== 'Sales' && user.role !== 'Admin') {
    return <Unauthorized requiredRoles={['Sales']} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">Sales Leads Pipeline</h1>
          <p className="text-slate-400 text-sm">
            Track users who have registered but have not completed their loan application.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          title="Refresh Leads"
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
          <p className="text-slate-500 text-xs">Querying pipelines...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/20">
          <p className="text-slate-400 text-sm font-medium">No registered leads found in the database.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {leads.map((lead, idx) => (
            <div
              key={lead.user._id || idx}
              className="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{lead.user.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{lead.user.email}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                    lead.stepReached === 3
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : lead.stepReached === 2
                      ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}>
                    {lead.stepReached === 3 ? 'Upload Completed' : lead.stepReached === 2 ? 'Details Filled' : 'Registered Only'}
                  </span>
                </div>

                {lead.profile ? (
                  <div className="pt-3 border-t border-slate-900/60 grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-500">PAN</span>
                      <p className="font-bold text-slate-300 uppercase">{lead.profile.pan}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Salary / Month</span>
                      <p className="font-bold text-slate-300">₹{lead.profile.monthlySalary.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Employment Mode</span>
                      <p className="font-bold text-slate-350">{lead.profile.employmentMode}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Salary Slip</span>
                      <p className="font-bold text-slate-350">
                        {lead.profile.salarySlipUrl ? (
                          <a
                            href={getFileUrl(lead.profile.salarySlipUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-350 underline"
                          >
                            View Upload
                          </a>
                        ) : (
                          <span className="text-slate-655 font-normal">Not uploaded</span>
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-900/60 text-xs text-slate-500 italic">
                    Borrower has not completed Step 2 (Personal Details) yet.
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
