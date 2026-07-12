import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  FileText, 
  Clock, 
  Activity, 
  Clipboard, 
  AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function DoctorDashboard() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || !sessionUser.doctorId) {
    redirect('/login');
  }

  // 1. Fetch Doctor details, upcoming appointments, and recent clinical visits
  const doctor = await db.doctor.findUnique({
    where: { id: sessionUser.doctorId },
    include: {
      appointments: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          preferredDate: { gte: new Date(new Date().setHours(0,0,0,0)) } // Today or onwards
        },
        orderBy: { preferredDate: 'asc' },
        take: 5,
        include: {
          patient: true
        }
      },
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 5,
        include: {
          patient: true
        }
      }
    }
  });

  if (!doctor) {
    return (
      <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-bold">Doctor Profile Not Found</h3>
        <p className="text-slate-500 text-sm">Please contact clinic administration to link your staff account.</p>
      </div>
    );
  }

  // Count metrics
  const totalVisits = await db.visit.count({ where: { doctorId: doctor.id } });
  const totalPatientsTreated = await db.visit.groupBy({
    by: ['patientId'],
    where: { doctorId: doctor.id }
  });
  const patientsCount = totalPatientsTreated.length;

  const pendingCount = doctor.appointments.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-8">
      {/* 1. Welcoming Profile Card */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full uppercase tracking-wider">
            Clinical Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight">Dr. {doctor.firstName} {doctor.lastName}</h1>
          <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
            {doctor.specialization} &bull; {doctor.department}
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-50">
            <span>Phone: {doctor.phone || 'N/A'}</span>
            <span>Email: {doctor.email}</span>
          </div>
        </div>
      </div>

      {/* 2. Fast Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Appointments</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{doctor.appointments.length}</h3>
            <p className="text-xs text-slate-500 mt-1">{pendingCount} requests pending confirm</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patients Under Care</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{patientsCount}</h3>
            <p className="text-xs text-slate-500 mt-1">Unique patients treated</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Consultations</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{totalVisits}</h3>
            <p className="text-xs text-slate-500 mt-1">Concluded records written</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
            <Clipboard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Columns: Daily Schedule & Concluded records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Schedule */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Next Patients Schedule</h3>
            </div>
            <Link 
              href="/dashboard/doctor/appointments" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Calendar Details
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {doctor.appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
                <Clock className="h-6 w-6 text-slate-300" />
                <span>No appointments booked on your schedule.</span>
              </div>
            ) : (
              doctor.appointments.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </p>
                    <p className="text-xs text-slate-500">Reason: &quot;{appt.reason}&quot;</p>
                    <p className="text-xs text-slate-400">DOB: {appt.patient.dateOfBirth.toLocaleDateString()} &bull; Sex: {appt.patient.sex}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">
                      {appt.preferredDate.toLocaleDateString()}
                    </span>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                      appt.status === 'CONFIRMED' 
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-amber-500/10 text-amber-700'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Concluded Records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Recent Clinical Summaries</h3>
            </div>
            <Link 
              href="/dashboard/doctor/patients" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Write Visit Notes
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {doctor.visits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
                <Activity className="h-6 w-6 text-slate-300" />
                <span>No clinical visits recorded under your provider name.</span>
              </div>
            ) : (
              doctor.visits.map((visit) => (
                <div key={visit.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </p>
                      <p className="text-xs text-slate-400">MRN: {visit.patient.mrn}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {visit.visitDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Diagnosis: <span className="font-bold text-slate-900 dark:text-white">{visit.diagnosis || 'General Checkup'}</span>
                    </p>
                    <p className="text-slate-500 italic truncate">&quot;{visit.notes}&quot;</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
