import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { 
  Heart, 
  Thermometer, 
  Scale, 
  Activity, 
  Calendar, 
  FileText, 
  PlusCircle, 
  AlertCircle,
  FileHeart
} from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function PatientDashboard() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || !sessionUser.patientId) {
    redirect('/login');
  }

  // 1. Fetch patient profile details
  const patient = await db.patient.findUnique({
    where: { id: sessionUser.patientId },
    include: {
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
        include: {
          doctor: true
        }
      },
      appointmentRequests: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] },
          preferredDate: { gte: new Date() }
        },
        orderBy: { preferredDate: 'asc' },
        take: 3,
        include: {
          doctor: true
        }
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          doctor: true,
          items: {
            include: {
              medicine: true
            }
          }
        }
      }
    }
  });

  if (!patient) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-bold">Patient Profile Not Found</h3>
        <p className="text-slate-500 text-sm">Please contact clinic administration to link your account.</p>
      </div>
    );
  }

  const latestVisit = patient.visits[0];

  return (
    <div className="space-y-8">
      {/* 1. Header Welcome banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight">Hello, {patient.firstName}!</h1>
          <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
            Welcome to your digital health folder. Here you can check your clinical vitals, view prescriptions from Elizabeth Blackwell, or manage clinic visits.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-emerald-50">
            <span>MRN: <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{patient.mrn}</span></span>
            <span>DOB: {patient.dateOfBirth.toLocaleDateString()}</span>
            <span>Sex: {patient.sex}</span>
          </div>
        </div>
      </div>

      {/* 2. Vitals Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Your Latest Vital Signs</h2>
        {latestVisit ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Blood Pressure */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</span>
                <h3 className="text-xl font-black mt-1">
                  {latestVisit.bloodPressureSystolic || '--'}/{latestVisit.bloodPressureDiastolic || '--'}
                </h3>
                <span className="text-[10px] text-slate-400 mt-1 block">mmHg</span>
              </div>
              <div className="h-10 w-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
            </div>

            {/* Heart Rate */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pulse Rate</span>
                <h3 className="text-xl font-black mt-1">
                  {latestVisit.heartRate || '--'} <span className="text-xs font-medium text-slate-400">BPM</span>
                </h3>
                <span className="text-[10px] text-slate-400 mt-1 block">Resting pulse</span>
              </div>
              <div className="h-10 w-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Body Temperature</span>
                <h3 className="text-xl font-black mt-1">
                  {latestVisit.temperatureC || '--'} <span className="text-xs font-medium text-slate-400">°C</span>
                </h3>
                <span className="text-[10px] text-slate-400 mt-1 block">Normal range</span>
              </div>
              <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                <Thermometer className="h-5 w-5" />
              </div>
            </div>

            {/* BMI/Weight */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Weight & Height</span>
                <h3 className="text-lg font-bold mt-1">
                  {latestVisit.weightKg || '--'} kg / {latestVisit.heightCm || '--'} cm
                </h3>
                <span className="text-[10px] text-slate-400 mt-1 block">Physical profile</span>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/5 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-400">No clinical visits recorded yet. Vitals charts appear after doctor sessions.</p>
          </div>
        )}
      </div>

      {/* 3. Splitted sections: Appointments & Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Upcoming Appointments</h3>
            </div>
            <Link 
              href="/dashboard/patient/appointments" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" /> Book New
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {patient.appointmentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
                <AlertCircle className="h-5 w-5 text-slate-300" />
                <span>You have no active appointments scheduled.</span>
              </div>
            ) : (
              patient.appointmentRequests.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{appt.doctor.specialization}</p>
                    <p className="text-xs font-medium text-slate-500">
                      Reason: {appt.reason}
                    </p>
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

        {/* Prescriptions column */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Active Prescriptions</h3>
            </div>
            <Link 
              href="/dashboard/patient/prescriptions" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4 flex-1">
            {patient.prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
                <FileHeart className="h-5 w-5 text-slate-300" />
                <span>No pharmacy prescriptions registered to your name.</span>
              </div>
            ) : (
              patient.prescriptions.map((presc) => (
                <div key={presc.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-slate-400">Prescribing Physician</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Dr. {presc.doctor.firstName} {presc.doctor.lastName}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {presc.createdAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                    {presc.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{item.medicine.name}</span>
                        <span className="text-slate-500">{item.dosage} — {item.frequency} ({item.duration})</span>
                      </div>
                    ))}
                  </div>

                  {presc.instructions && (
                    <p className="text-[10px] italic text-slate-400 pt-1">
                      Instructions: &quot;{presc.instructions}&quot;
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
