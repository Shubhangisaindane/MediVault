'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Calendar, 
  Activity, 
  Mail, 
  Phone, 
  Loader2, 
  X, 
  Clock,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  department: string;
  email: string;
  phone: string | null;
  availability: any; // Record<string, string[]>
};

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal States
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    specialization: '',
    department: '',
    email: '',
    phone: '',
    password: '',
  });

  const [activeDays, setActiveDays] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: false,
    Wednesday: true,
    Thursday: false,
    Friday: true,
    Saturday: false,
    Sunday: false,
  });

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.doctors);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch doctors registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDayToggle = (day: string) => {
    setActiveDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    // Build availability object: map checked days to a default shift
    const availability: Record<string, string[]> = {};
    Object.keys(activeDays).forEach(day => {
      if (activeDays[day]) {
        availability[day] = ["09:00-17:00"];
      }
    });

    try {
      await axios.post('/api/doctors', {
        ...formData,
        availability
      });
      setCreateOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        specialization: '',
        department: '',
        email: '',
        phone: '',
        password: '',
      });
      setActiveDays({
        Monday: true,
        Tuesday: false,
        Wednesday: true,
        Thursday: false,
        Friday: true,
        Saturday: false,
        Sunday: false,
      });
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register new medical staff.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${name}? This will delete their user credentials and roster profiles.`)) {
      return;
    }
    try {
      await axios.delete('/api/doctors', { data: { id } });
      fetchDoctors();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete doctor.');
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      {/* 1. Header Control bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Clinical Staff Roster</h1>
          <p className="text-slate-500 text-xs mt-0.5">Manage doctor profile cards, specialties, and scheduling availability logs.</p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Hire Medical Staff
        </button>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Doctors Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto" />
          <span className="text-slate-400 mt-2 block text-xs">Loading staff directories...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No medical practitioners registered. Click &quot;Hire Medical Staff&quot; to begin.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            // Count total active work days
            const availableDays = Object.keys(doc.availability || {});
            return (
              <div 
                key={doc.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                {/* Upper info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-sm">
                        Dr
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          Dr. {doc.firstName} {doc.lastName}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 rounded">
                          {doc.specialization}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteDoctor(doc.id, `${doc.firstName} ${doc.lastName}`)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="De-register Doctor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {doc.phone || 'No phone logged'}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {doc.email}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      {doc.department}
                    </p>
                  </div>
                </div>

                {/* Lower Shifts Calendar */}
                <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-4 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Weekly Availability Grid
                  </span>
                  <div className="flex gap-1">
                    {daysOfWeek.map(day => {
                      const isActive = !!doc.availability?.[day];
                      const dayLetter = day.slice(0, 2); // Mo, Tu, We...
                      return (
                        <span
                          key={day}
                          className={`flex-1 text-[9px] font-bold py-1 rounded text-center select-none ${
                            isActive 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-50 text-slate-300 dark:bg-slate-950 dark:text-slate-800'
                          }`}
                          title={`${day}: ${isActive ? '09:00 - 17:00' : 'Unavailable'}`}
                        >
                          {dayLetter}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Hire Doctor Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setCreateOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setCreateOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" /> Hire Medical Staff Profile
            </h3>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">First Name</label>
                  <input
                    type="text" required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Last Name</label>
                  <input
                    type="text" required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Specialization</label>
                  <input
                    type="text" required
                    placeholder="e.g. Cardiology"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Department</label>
                  <input
                    type="text" required
                    placeholder="e.g. Cardiology Dept"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Email Address</label>
                  <input
                    type="email" required
                    placeholder="doctor@medivault.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Initial Password</label>
                  <input
                    type="password" required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Day selectors */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Work Day Shifts</label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center gap-2 p-2 border rounded-lg text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={activeDays[day]}
                        onChange={() => handleDayToggle(day)}
                        className="accent-emerald-600"
                      />
                      {day.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center mt-4"
              >
                {createLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Register Doctor Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
