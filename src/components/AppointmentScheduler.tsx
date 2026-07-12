'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';

type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  preferredDate: string;
  reason: string;
  status: string;
  staffNote: string | null;
  patient: {
    firstName: string;
    lastName: string;
    mrn: string;
  };
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
    availability: any;
  };
};

type DoctorOption = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  availability: any;
};

type SchedulerProps = {
  userRole: string;
  patientId?: string | null;
};

export default function AppointmentScheduler({ userRole, patientId }: SchedulerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<any[]>([]); // For receptionist intake
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState('');

  // Form State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    targetPatientId: patientId || '',
    doctorId: '',
    preferredDate: '',
    reason: '',
  });

  const isPatient = userRole === 'PATIENT';
  const isStaff = ['ADMIN', 'RECEPTIONIST'].includes(userRole);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/appointments', {
        params: { status: filterStatus }
      });
      setAppointments(response.data.appointments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to retrieve appointments list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const docRes = await axios.get('/api/doctors');
      setDoctors(docRes.data.doctors);

      if (isStaff) {
        // Fetch patient list for receptionist drop-down selection
        const patRes = await axios.get('/api/patients', { params: { limit: 100 } });
        setPatients(patRes.data.patients);
      }
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    fetchFormOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      patientId: isPatient ? undefined : formData.targetPatientId,
      doctorId: formData.doctorId,
      preferredDate: formData.preferredDate,
      reason: formData.reason,
    };

    try {
      const response = await axios.post('/api/appointments', payload);
      if (response.data.success) {
        setFormSuccess('Appointment scheduled successfully!');
        setFormData({
          targetPatientId: patientId || '',
          doctorId: '',
          preferredDate: '',
          reason: '',
        });
        fetchAppointments();
        setTimeout(() => {
          setBookingOpen(false);
          setFormSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'An error occurred during booking check.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axios.put('/api/appointments', { id, status: newStatus });
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to change booking status.');
    }
  };

  const selectedDoctor = doctors.find(d => d.id === formData.doctorId);

  return (
    <div className="space-y-6">
      {/* 1. Header Navigation */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Appointments Center</h1>
          <p className="text-slate-500 text-xs mt-0.5">Review pending consultation requests, check doctor availabilities, or log cancellations.</p>
        </div>

        <button
          onClick={() => setBookingOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Request Booking
        </button>
      </div>

      {/* 2. Filters & Status tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex gap-2">
          {['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === status 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {status === '' ? 'All Bookings' : status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Appointment list */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mx-auto" />
          <span className="text-slate-400 mt-2 block text-xs">Querying appointment calendar...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          No appointments recorded matching this status.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((appt) => {
            const isConfirmed = appt.status === 'CONFIRMED';
            const isPending = appt.status === 'PENDING';
            const isCompleted = appt.status === 'COMPLETED';
            const isCancelled = appt.status === 'CANCELLED';

            return (
              <div 
                key={appt.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          isConfirmed ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : isCompleted ? 'bg-blue-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {appt.status}
                        </span>
                      </div>
                      
                      {/* Name Details depending on role */}
                      {isPatient ? (
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                        </h3>
                      ) : (
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                          Patient: {appt.patient.firstName} {appt.patient.lastName}
                        </h3>
                      )}
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-850 rounded">
                      {isPatient ? appt.doctor.specialization : `MRN: ${appt.patient.mrn}`}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/50 pt-3 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Date: {new Date(appt.preferredDate).toLocaleDateString()}
                    </p>
                    <p className="flex items-center gap-1.5 italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg">
                      Reason: &quot;{appt.reason}&quot;
                    </p>
                    {!isPatient && (
                      <p className="text-[10px] text-slate-400">
                        Patient Contacts: {appt.patient.firstName} &bull; Email: {appt.patient.firstName.toLowerCase()}@medivault.com
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-4 flex justify-end gap-2">
                  {/* Patients can cancel pending bookings */}
                  {isPatient && isPending && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  )}

                  {/* Staff (Admin/Receptionist) can confirm or cancel */}
                  {!isPatient && isPending && (
                    <>
                      <button
                        onClick={() => handleStatusChange(appt.id, 'CONFIRMED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}

                  {/* Doctors can mark confirmed appointments as COMPLETED */}
                  {userRole === 'DOCTOR' && isConfirmed && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Complete Visit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Booking Form Modal */}
      {bookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div onClick={() => setBookingOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setBookingOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" /> Book New Consultation
            </h3>

            {formError && (
              <div className="mb-4 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                <Check className="h-5 w-5 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              {/* Patient selection (only for receptionist/admin) */}
              {isStaff && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Select Patient</label>
                  <select
                    required
                    value={formData.targetPatientId}
                    onChange={(e) => setFormData({...formData, targetPatientId: e.target.value})}
                    className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} (MRN: {p.mrn})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Doctor selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Select Medical Specialist</label>
                <select
                  required
                  value={formData.doctorId}
                  onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              {/* Show availability of selected doctor */}
              {selectedDoctor && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[10px] space-y-1">
                  <span className="font-bold text-slate-400 block">DOCTOR DAYS AVAILABLE</span>
                  <div className="flex gap-1 pt-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const isAvail = !!selectedDoctor.availability?.[day];
                      return (
                        <span 
                          key={day} 
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            isAvail ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Booking Date */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Booking Date</label>
                <input
                  type="date"
                  required
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Reason for Visit</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual cardiovascular health checkup"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full border px-3 py-2 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center justify-center mt-4"
              >
                {bookingLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Confirm Slot Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
