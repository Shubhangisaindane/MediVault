import React from 'react';
import { 
  Users, 
  Activity, 
  CalendarCheck, 
  DollarSign, 
  Clock, 
  FileLock, 
  AlertCircle 
} from 'lucide-react';
import { db } from '@/lib/db';
import AdminCharts from '@/components/AdminCharts';

export const revalidate = 0; // Disable static caching so admin always sees fresh database records

export default async function AdminDashboard() {
  // 1. Fetch live metrics from database
  const patientCount = await db.patient.count();
  const doctorCount = await db.doctor.count();
  const pendingAppointments = await db.appointmentRequest.count({
    where: { status: 'PENDING' }
  });

  const billingTotal = await db.invoice.aggregate({
    _sum: {
      total: true
    }
  });
  const grossRevenue = billingTotal._sum.total || 0;

  // 2. Fetch recent audit logs
  const recentLogs = await db.auditLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: true
    }
  });

  const kpis = [
    {
      label: 'Registered Patients',
      value: patientCount,
      change: 'Active EHR records',
      icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      label: 'Medical Staff (Doctors)',
      value: doctorCount,
      change: 'Active schedules',
      icon: <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    },
    {
      label: 'Pending Appointments',
      value: pendingAppointments,
      change: 'Awaiting receptionist intake',
      icon: <CalendarCheck className="h-5 w-5 text-amber-500" />
    },
    {
      label: 'Gross Invoiced Fees',
      value: `$${grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Billing cycle total',
      icon: <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* 1. Header welcome */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Analytics Command Center</h1>
        <p className="text-slate-500 mt-1">Hospital operational overview and compliance monitoring.</p>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <h3 className="text-2xl font-black mt-2 tracking-tight">{kpi.value}</h3>
              <p className="text-xs text-slate-500 mt-1">{kpi.change}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center border border-slate-100 dark:border-slate-800">
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Charts component */}
      <AdminCharts />

      {/* 4. Recent Audit Logs Trail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <FileLock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-lg font-bold">HIPAA Compliance Audit Log Trail</h3>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Live Trace
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Timestamp</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Actor</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Role</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Action</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Modified Target</th>
                <th className="pb-3 font-semibold text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6 text-slate-300" />
                      <span>No audits recorded yet. Activity logs spawn on user actions.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 font-medium text-slate-500 text-xs">
                      {log.createdAt.toLocaleString()}
                    </td>
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-100">
                      {log.actor.email}
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {log.actor.role}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.action === 'SIGNUP' || log.action === 'LOGIN' 
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-mono text-slate-400">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </td>
                    <td className="py-4">
                      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        SUCCESS
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
