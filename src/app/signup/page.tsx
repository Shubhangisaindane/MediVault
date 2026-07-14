'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, Phone, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { normalizeEmail, normalizePhone } from '@/lib/validation';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: 'Female',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (name === "phone") {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 10);

    setFormData((prev) => ({
      ...prev,
      phone: digitsOnly,
    }));
    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail(formData.email);
    const phone = normalizePhone(formData.phone);
  
    if (!email) {
      setError('Enter a valid email address.');
      return;
    }
    if (formData.phone && !phone) {
      setError('Enter a valid phone number with 10 digits.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/auth/signup', { ...formData, email, phone });
      if (response.data.success) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-slate-50/0 to-slate-50/0 dark:from-emerald-500/5 dark:via-slate-950/0 dark:to-slate-950/0 pointer-events-none" />

      <div className="w-full max-w-lg my-8">
        {/* Brand logo */}
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
            Patient Portal Registration
          </h2>
        </div>

        {/* Card wrapper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
            <p className="text-sm text-slate-500 mt-1.5">Register as a patient to manage your clinical records and book appointments</p>
          </div>

          {error && (
            <div className="mb-6 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    name="lastName"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    required
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Biological Sex
                </label>
                <select
                  name="sex"
                  required
                  value={formData.sex}
                  onChange={handleChange}
                  className="block w-full px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  title="Please enter exactly 10 digits."
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Home Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="address"
                  placeholder="123 Health Dr, City, State"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
