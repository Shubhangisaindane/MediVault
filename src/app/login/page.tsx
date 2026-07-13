'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to prefill seeded accounts for trial evaluators
  const prefillAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-50/0 to-slate-50/0 dark:from-emerald-500/5 dark:via-slate-950/0 dark:to-slate-950/0 pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo brand */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              MediVault
            </span>
          </Link>
          <h2 className="text-lg font-medium text-slate-500 mt-2">
            Secure Healthcare Management System
          </h2>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Access Portal</h1>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to your workplace or patient account</p>
          </div>

          {error && (
            <div className="mb-6 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="name@medivault.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have a patient account?{' '}
            <Link href="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
