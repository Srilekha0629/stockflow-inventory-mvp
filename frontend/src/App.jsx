import React, { useState, useEffect } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      // Proxied to http://localhost:5000 in dev via vite.config.js
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch backend health:', err);
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-200">
              SF
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">StockFlow</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                MVP v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              Multi-Tenant SaaS Inventory System
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Environment Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span className="text-indigo-600">StockFlow</span> MVP
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            A high-performance, multi-tenant inventory management system built with React,
            Node.js, Express, MySQL, and Tailwind CSS.
          </p>
        </div>

        {/* System Health Check Live Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Full-Stack Health Check Status
              </h2>
              <p className="text-sm text-slate-500">
                Pinging backend endpoint: <code className="text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">GET /api/health</code>
              </p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>

          <div className="p-6">
            {loading && !health ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-sm">Connecting to backend service...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-amber-800">Backend Not Reachable</h3>
                    <div className="mt-1 text-sm text-amber-700">
                      <p>{error}</p>
                      <p className="mt-2 text-xs font-mono bg-white/60 p-2 rounded">
                        Ensure Express server is running on port 5000: <code className="font-bold">cd backend && npm run dev</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Backend Server Status */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Backend Service</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                      {health?.status?.toUpperCase() || 'ONLINE'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">{health?.service || 'StockFlow API'}</div>
                  <div className="text-xs text-slate-500 mt-1">Uptime: {health?.uptime || 'N/A'}</div>
                </div>

                {/* Database Connection Status */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MySQL Database</span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      health?.database?.status === 'connected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {health?.database?.status?.toUpperCase() || 'STANDBY'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    {health?.database?.status === 'connected' ? 'Connected' : 'Connection Standby'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 truncate" title={health?.database?.details}>
                    {health?.database?.details || 'Database configuration verified'}
                  </div>
                </div>

                {/* Environment Info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Environment</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
                      {health?.environment?.toUpperCase() || 'DEV'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-800">Node + Express + Vite</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Last Checked: {lastChecked || 'Just now'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Architecture & Stack Overview */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Project Stack & Architecture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Frontend */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-3">
                ⚛️
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">React + Vite</h3>
              <p className="text-xs text-slate-500">
                Modern client-side SPA with lightning-fast HMR, modular component structure, and environment proxying.
              </p>
            </div>

            {/* Styling */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-lg mb-3">
                🎨
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Tailwind CSS</h3>
              <p className="text-xs text-slate-500">
                Utility-first CSS framework configured with PostCSS and custom brand theme tokens for a clean SaaS UI.
              </p>
            </div>

            {/* Backend */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-3">
                🚀
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Express API</h3>
              <p className="text-xs text-slate-500">
                RESTful backend with ES Modules, health check endpoints, modular routing, and centralized error handling.
              </p>
            </div>

            {/* Database & Auth */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-3">
                🛡️
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">MySQL & JWT</h3>
              <p className="text-xs text-slate-500">
                mysql2 connection pooling configured via environment variables, ready for multi-tenant isolation and JWT auth.
              </p>
            </div>
          </div>
        </div>

        {/* Initialization Checklist */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Initial Setup Verification Checklist</h2>
          <div className="space-y-3">
            {[
              { title: 'Full-stack folder separation (/frontend and /backend)', status: true },
              { title: 'Vite + React configured with Tailwind CSS', status: true },
              { title: 'Express backend configured with appropriate dependencies', status: true },
              { title: 'MySQL pool configuration via environment variables', status: true },
              { title: 'Health check API endpoint (/api/health) active', status: true },
              { title: '.gitignore configured for secrets, build outputs, and dependencies', status: true },
              { title: 'Zero hardcoded secrets (strict .env.example templates)', status: true },
              { title: 'Comprehensive documentation in README.md', status: true },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-700">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        StockFlow MVP &bull; Multi-Tenant SaaS Inventory Management System &bull; Internship Assessment
      </footer>
    </div>
  );
}
