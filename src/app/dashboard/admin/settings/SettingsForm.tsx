'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, Building2, Mail, Clock, Package, ShieldAlert, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';

type Settings = {
  clinicName: string;
  supportEmail: string;
  appointmentSlotMinutes: string;
  lowStockThreshold: string;
  maintenanceMode: string;
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get('/api/admin/settings')
      .then((res) => setSettings(res.data.settings))
      .catch(() => setError('Could not load settings.'))
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!settings) return;
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.post('/api/admin/settings', settings);
      setSuccess('Settings saved.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="w-full max-w-lg mx-auto">
        <div className="flex flex-col items-center mb-8">
          <Link href="/dashboard/admin" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              MediVault
            </span>
          </Link>
          <h2 className="text-lg font-medium text-slate-500 mt-2">
            System Settings
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl shadow-slate-100/50 dark:shadow-none">
          {fetching ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading settings...
            </div>
          ) : !settings ? (
            <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error || 'Could not load settings.'}</span>
            </div>
          ) : (
            <>
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
                    Clinic Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      name="clinicName"
                      required
                      value={settings.clinicName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Support Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      name="supportEmail"
                      required
                      value={settings.supportEmail}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Appointment Slot (minutes)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      name="appointmentSlotMinutes"
                      required
                      min={5}
                      step={5}
                      value={settings.appointmentSlotMinutes}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Alert Threshold (units)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Package className="h-4 w-4" />
                    </div>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      required
                      min={0}
                      value={settings.lowStockThreshold}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm transition-all dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-950"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Maintenance Mode
                    </span>
                    <select
                      name="maintenanceMode"
                      value={settings.maintenanceMode}
                      onChange={handleChange}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="false">Off</option>
                      <option value="true">On</option>
                    </select>
                  </label>
                  <p className="text-xs text-slate-400 mt-1.5 px-1">
                    Stored for reference — enforcing a maintenance banner or login block elsewhere in the app is a follow-up step, not automatic yet.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none mt-6"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
