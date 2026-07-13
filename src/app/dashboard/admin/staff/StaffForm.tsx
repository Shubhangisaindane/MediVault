'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Activity, Mail, Lock, User, Building2, Stethoscope, Phone, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

type StaffRole = 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

const initialState = {
  email: '',
  password: '',
  role: 'RECEPTIONIST' as StaffRole,
  firstName: '',
  lastName: '',
  specialization: '',
  department: '',
  phone: '',
};

export default function StaffForm() {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, string> = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === 'DOCTOR') {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
        payload.specialization = formData.specialization;
        payload.department = formData.department;
        payload.phone = formData.phone;
      }

      await axios.post('/api/admin/create-staff', payload);
      setSuccess(`${formData.role.charAt(0) + formData.role.slice(1).toLowerCase()} account created for ${formData.email}.`);
      setFormData(initialState);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              MediVault
            </span>
          </Link>
          <h2 className="text-lg font-medium text-slate-500 mt-2">
            Admin — Create Staff Account
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight">New Staff Account</h1>
            <p className="text-sm text-slate-500 mt-1.5">Create a Doctor, Receptionist, or Admin login</p>
          </div>

          {error && (
            <div className="mb-6 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role
              </label>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
              >
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="DOCTOR">Doctor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

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
                  required
                  placeholder="name@medivault.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Temporary Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Share this with them securely — they can reset it via Forgot Password after logging in.</p>
            </div>

            {formData.role === 'DOCTOR' && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-4">
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
                        placeholder="Sarah"
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
                        placeholder="Blackwell"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Specialization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="specialization"
                      required
                      placeholder="Cardiology"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="department"
                      required
                      placeholder="Cardiology Department"
                      value={formData.department}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
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
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>
              </div>
            )}

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
            <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
