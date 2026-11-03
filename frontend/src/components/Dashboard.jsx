import React, { useState, useEffect } from 'react';

export default function Dashboard({ user, onNavigateToProducts }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    const token = sessionStorage.getItem('stockflow_token');

    if (!token) {
      setError('Session expired or missing authentication token. Please log in.');
      setLoading(false);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const summaryEndpoint = baseUrl.endsWith('/api')
      ? `${baseUrl}/products/summary`
      : `${baseUrl}/api/products/summary`;

    try {
      const response = await fetch(summaryEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized session. Please log in again.');
        }
        throw new Error(`Failed to load dashboard metrics (HTTP ${response.status})`);
      }

      const json = await response.json();
      setSummary(json.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message || 'Unable to connect to backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Tenant Workspace: {user?.organizationName || 'Default Organization'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock analytics and low-stock alerts for {user?.name || 'Administrator'}.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {onNavigateToProducts && (
            <button
              onClick={onNavigateToProducts}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Manage Products
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSummary} className="font-semibold underline ml-3 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Products */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.totalProducts ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Unique catalog SKUs tracked</p>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inventory Units</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-900">
              {loading ? '...' : summary?.totalQuantity ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Total physical stock on hand</p>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              (summary?.lowStockCount || 0) > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${
              (summary?.lowStockCount || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {loading ? '...' : summary?.lowStockCount ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-1">Quantity &le; Threshold (Default: 5)</p>
          </div>
        </div>
      </div>

      {/* Low Stock Products Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Low-Stock Items Needing Reorder
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies inventory items where quantity is below or equal to the reorder threshold.
            </p>
          </div>
          {summary?.lowStockCount > 0 && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
              {summary.lowStockCount} Action Required
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Calculating inventory thresholds...</p>
          </div>
        ) : summary?.lowStockProducts && summary.lowStockProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Product Name</th>
                  <th scope="col" className="px-6 py-3.5">SKU</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Current Quantity</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Threshold</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Selling Price</th>
                  <th scope="col" className="px-6 py-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.lowStockProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {prod.name}
                      {prod.description && (
                        <p className="text-xs text-slate-400 font-normal truncate max-w-xs">{prod.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 font-medium">
                      {prod.sku}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-amber-700">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                        {prod.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-500 font-mono text-xs">
                      {prod.lowStockThreshold}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                      ${prod.sellingPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-6 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">All Stock Levels Healthy</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No products are currently at or below their reorder thresholds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
