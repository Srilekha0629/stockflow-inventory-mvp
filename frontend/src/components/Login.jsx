import React, { useState } from 'react';

export default function Login({ onNavigateToSignup, onNavigateToHealth }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(() => {
    // Check if session already exists
    const storedUser = sessionStorage.getItem('stockflow_user');
    const storedToken = sessionStorage.getItem('stockflow_token');
    if (storedUser && storedToken) {
      try {
        return JSON.parse(storedUser);
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  const validate = (dataToValidate = formData) => {
    const newErrors = {};

    // 1. Work Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!dataToValidate.email.trim()) {
      newErrors.email = 'Work email is required.';
    } else if (!emailRegex.test(dataToValidate.email.trim())) {
      newErrors.email = 'Please provide a valid work email address.';
    }

    // 2. Password
    if (!dataToValidate.password) {
      newErrors.password = 'Password is required.';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setServerError(null);

    if (touched[name]) {
      const fieldErrors = validate(updatedForm);
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name] || '',
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validate();
    setErrors((prev) => ({
      ...prev,
      [name]: fieldErrors[name] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setTouched({
      email: true,
      password: true,
    });

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    setServerError(null);

    // Resolve API endpoint: proxy `/api` or env URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const loginEndpoint = baseUrl.endsWith('/api')
      ? `${baseUrl}/auth/login`
      : `${baseUrl}/api/auth/login`;

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Clear, secure error message on 401 or 400
        const errorMessage = data.message || 'Invalid email or password. Please try again.';
        setServerError(errorMessage);
        return;
      }

      // Success: Save token and user details in sessionStorage (matches signup)
      if (data.data?.token) {
        sessionStorage.setItem('stockflow_token', data.data.token);
        sessionStorage.setItem('stockflow_user', JSON.stringify(data.data.user));
      }

      setLoggedInUser(data.data.user);
    } catch (err) {
      console.error('Login error:', err);
      setServerError(
        'Unable to reach backend server. Please verify the Express backend is running on port 5000.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('stockflow_token');
    sessionStorage.removeItem('stockflow_user');
    setLoggedInUser(null);
    setFormData({ email: '', password: '' });
    setErrors({});
    setTouched({});
    setServerError(null);
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATED SUCCESS STATE VIEW
  // ---------------------------------------------------------------------------
  if (loggedInUser) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-indigo-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back, {loggedInUser.name}!</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Successfully authenticated to your tenant organization workspace.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-slate-200/80 pb-2.5">
              <span className="text-slate-500 font-medium">Organization (Tenant)</span>
              <span className="font-bold text-slate-800">
                {loggedInUser.organizationName}{' '}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (ID: #{loggedInUser.organizationId})
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-slate-200/80 pb-2.5">
              <span className="text-slate-500 font-medium">Authenticated User</span>
              <span className="font-semibold text-slate-800">
                {loggedInUser.name}{' '}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  (ID: #{loggedInUser.id})
                </span>
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-b border-slate-200/80 pb-2.5">
              <span className="text-slate-500 font-medium">Work Email</span>
              <span className="font-mono text-slate-700 text-xs sm:text-sm">{loggedInUser.email}</span>
            </div>

            <div className="flex justify-between items-center text-sm pt-0.5">
              <span className="text-slate-500 font-medium">Session Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
                JWT Stored in sessionStorage
              </span>
            </div>
          </div>

          {/* Session confirmation card without exposing raw token string */}
          <div className="bg-indigo-50/70 rounded-xl p-4 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/10 text-indigo-700 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-900">Authentication Token: Active</p>
                <p className="text-[11px] text-indigo-700">Session Status: JWT Stored in sessionStorage</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Active
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 border border-rose-300 rounded-lg text-sm font-medium text-rose-700 bg-white hover:bg-rose-50 transition-colors shadow-sm text-center cursor-pointer"
            >
              Sign Out
            </button>
            {onNavigateToHealth && (
              <button
                onClick={onNavigateToHealth}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm text-center cursor-pointer"
              >
                Inspect System Health
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LOGIN FORM VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-xl mx-auto my-6 sm:my-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-b from-indigo-50/50 to-white">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200">
              SF
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Workspace Access
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign In to StockFlow</h2>
          <p className="text-sm text-slate-600 mt-1">
            Access your multi-tenant organization inventory dashboard.
          </p>
        </div>

        {/* Server Error Alert Banner */}
        {serverError && (
          <div className="mx-6 sm:mx-8 mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 animate-fadeIn">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-800">Authentication Failed</h4>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8 space-y-5">
          {/* Work Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Work Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@company.com"
                className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border transition-colors outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
                  touched.email && errors.email
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-xs text-rose-600 mt-1 flex items-center">
                <span className="inline-block w-1 h-1 bg-rose-500 rounded-full mr-1.5"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isLoading}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your account password"
                className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border transition-colors outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 ${
                  touched.password && errors.password
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100 bg-rose-50/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {touched.password && errors.password && (
              <p className="text-xs text-rose-600 mt-1 flex items-center">
                <span className="inline-block w-1 h-1 bg-rose-500 rounded-full mr-1.5"></span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Sign In to Workspace'
              )}
            </button>
          </div>

          {/* Navigation to Signup */}
          {onNavigateToSignup && (
            <div className="text-center pt-2 text-xs text-slate-600 border-t border-slate-100">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer underline underline-offset-2"
              >
                Create an organization account
              </button>
            </div>
          )}

          {/* Security Subtext */}
          <div className="text-center pt-1">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Encrypted password verification & stateless JWT sessions</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
