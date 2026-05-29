import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <span className="font-extrabold text-slate-950 text-lg">CS</span>
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              CreditSea
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-lg shadow-lg shadow-teal-500/10 hover:shadow-teal-500/25 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative pt-24 pb-20 px-6 overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-teal-400 mb-6 font-medium">
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.813L9 9l.813 5.187L15 15l-5.187.814zM19.071 4.929l-.353 2.214-2.215.353 2.215.353.353 2.215.353-2.215 2.215-.353-2.215-.353-.353-2.214z" />
              </svg>
              <span>Premium Loan Management System</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Instant Loans. <br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Transparent Lifecycle.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Experience the future of digital lending. Submit applications with immediate eligibility verification, track progress in real-time, and manage disbursements securely.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-xl shadow-xl shadow-teal-500/10 hover:shadow-teal-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Apply as Borrower
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 font-semibold bg-slate-900 hover:bg-slate-850 text-white rounded-xl border border-slate-800 hover:border-slate-700 transition-all duration-200"
              >
                Access Staff Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6 border-t border-slate-900/60 bg-slate-950/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                Designed for speed and reliability
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">
                Our automated workflows bridge the gap between borrowers and internal operations teams.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-teal-500/30 transition-all group duration-300">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Business Rule Engine</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automated server-side BRE running checks on PAN formats, monthly income thresholds, age ranges, and employment classifications to prevent fraud instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-teal-500/30 transition-all group duration-300">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Live Loan Configuration</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Borrowers select exact parameters with dynamic sliders and view instantaneous repayment schedules, calculated transparently with standard Simple Interest metrics.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-900 hover:border-teal-500/30 transition-all group duration-300">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">Operations Dashboard</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Dedicated workspace modules for Sales, Sanction, Disbursement, and Collections teams, guarded dynamically by role-based API access control.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-900/60 bg-slate-950 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CreditSea Technologies. All rights reserved.</p>
          <div className="flex space-x-4 text-slate-500">
            <span>MERN Stack</span>
            <span>•</span>
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
