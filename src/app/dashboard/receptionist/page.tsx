import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Calendar,
  Users,
  CreditCard,
  Clock,
  Check,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import PendingAppointmentQueue from '@/components/PendingAppointmentQueue';

export const revalidate = 0;

export default async function ReceptionistDashboard() {
  const sessionUser = await getSessionUser();

  if (!sessionUser || sessionUser.role !== 'RECEPTIONIST') {
    redirect('/login');
  }

  // 1. Fetch pending appointment requests (to confirm/reschedule)
  const pendingRequests = await db.appointmentRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { preferredDate: 'asc' },
    take: 5
  });

  // 2. Fetch today's confirmed appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const confirmedAppointments = await db.appointmentRequest.findMany({
    where: {
      status: 'CONFIRMED',
      preferredDate: {
        gte: today,
        lte: endOfDay
      }
    },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { preferredDate: 'asc' }
  });

  // 3. Fetch upcoming confirmed appointments (tomorrow -> next 7 days)
  const tomorrowStart = new Date(today);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const upcomingWindowEnd = new Date(today);
  upcomingWindowEnd.setDate(upcomingWindowEnd.getDate() + 7);
  upcomingWindowEnd.setHours(23, 59, 59, 999);

  const upcomingAppointments = await db.appointmentRequest.findMany({
    where: {
      status: 'CONFIRMED',
      preferredDate: {
        gte: tomorrowStart,
        lte: upcomingWindowEnd
      }
    },
    include: {
      patient: true,
      doctor: true
    },
    orderBy: { preferredDate: 'asc' }
  });

  // KPI Calculations
  const patientCount = await db.patient.count();
  const pendingCount = await db.appointmentRequest.count({ where: { status: 'PENDING' } });
  const pendingInvoices = await db.invoice.count({ where: { status: 'PENDING' } });

  // Helper to format a preferredDate as a short relative/day label (e.g. "Tomorrow", "Thu, Jul 17")
  function formatUpcomingDateLabel(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-8">
      {/* 1. Header welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="text-xs font-bold px-3 py-1 bg-white/20 rounded-full uppercase tracking-wider">
            Front Desk Portal
          </span>
          <h1 className="text-3xl font-black tracking-tight">Clinic Intake Center</h1>
          <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
            Manage patient registration, check-in, doctor availability scheduling, and process invoice collection.
          </p>
        </div>
      </div>

      {/* 2. Fast KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Patients</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{patientCount}</h3>
            <p className="text-xs text-slate-500 mt-1">Registered clinic patients</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-emerald-600 dark:text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Bookings</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{pendingCount}</h3>
            <p className="text-xs text-slate-500 mt-1">Awaiting schedule confirmation</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-amber-500">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unpaid Invoices</span>
            <h3 className="text-2xl font-black mt-2 tracking-tight">{pendingInvoices}</h3>
            <p className="text-xs text-slate-500 mt-1">Pending payments collection</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-rose-500">
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Action Areas: Pending Approval vs Today Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Approval Queues */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Awaiting Confirmation Queue</h3>
            </div>
            <span className="text-xs font-bold text-slate-400">{pendingRequests.length} total</span>
          </div>

          <PendingAppointmentQueue
            requests={pendingRequests.map((req) => ({
              id: req.id,
              reason: req.reason,
              preferredDate: req.preferredDate,
              patient: {
                firstName: req.patient.firstName,
                lastName: req.patient.lastName,
                mrn: req.patient.mrn,
              },
              doctor: { lastName: req.doctor.lastName },
            }))}
          />
        </div>

        {/* Today Arrivals */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <h3 className="font-bold">Today&apos;s Arrivals</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {confirmedAppointments.length} confirmed
            </span>
          </div>

          <div className="space-y-4 flex-1">
            {confirmedAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
                <AlertCircle className="h-5 w-5 text-slate-300" />
                <span>No confirmed arrivals scheduled for today.</span>
              </div>
            ) : (
              confirmedAppointments.map((appt) => (
                <div key={appt.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {appt.patient.firstName} {appt.patient.lastName}
                    </p>
                    <p className="text-xs text-slate-400">Physician: Dr. {appt.doctor.firstName} {appt.doctor.lastName}</p>
                    <p className="text-xs text-slate-500 font-medium">Reason: {appt.reason}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    <Check className="h-4 w-4" /> Ready
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Upcoming Confirmed Appointments (next 7 days, excluding today) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold">Upcoming Appointments</h3>
            <span className="text-xs text-slate-400 font-medium">(next 7 days)</span>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {upcomingAppointments.length} confirmed
          </span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
            <AlertCircle className="h-5 w-5 text-slate-300" />
            <span>Nothing confirmed for the next 7 days yet.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {appt.patient.firstName} {appt.patient.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    Physician: Dr. {appt.doctor.firstName} {appt.doctor.lastName}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Reason: {appt.reason}</p>
                </div>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {formatUpcomingDateLabel(appt.preferredDate)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Check className="h-3 w-3" /> Confirmed
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
