import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Role } from '@prisma/client';
import {
  Users, Stethoscope, Calendar, DollarSign, UserPlus,
  Settings, AlertTriangle, Activity, Clock, TrendingUp,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const user = await getSessionUser();

  if (!user) redirect('/login');
  if (user.role !== Role.ADMIN) redirect('/dashboard');

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    patientCount,
    doctorCount,
    receptionistCount,
    newPatientsThisMonth,
    appointmentsByStatus,
    revenueAgg,
    pendingInvoicesAgg,
    lowStockMedicines,
    recentAuditLogs,
  ] = await Promise.all([
    db.patient.count(),
    db.doctor.count(),
    db.user.count({ where: { role: Role.RECEPTIONIST } }),
    db.patient.count({ where: { createdAt: { gte: startOfMonth } } }),
    db.appointmentRequest.groupBy({ by: ['status'], _count: { status: true } }),
    db.invoice.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
    db.invoice.aggregate({ where: { status: 'PENDING' }, _sum: { total: true }, _count: true }),
    db.medicine.findMany({ where: { stock: { lt: 50 } }, orderBy: { stock: 'asc' }, take: 5 }),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { actor: { select: { email: true, role: true } } },
    }),
  ]);

  const statusCounts = Object.fromEntries(
    appointmentsByStatus.map((row) => [row.status, row._count.status])
  ) as Record<string, number>;

  const totalRevenue = revenueAgg._sum.total || 0;
  const pendingInvoiceTotal = pendingInvoicesAgg._sum.total || 0;
  const pendingInvoiceCount = pendingInvoicesAgg._count || 0;

  const statCards = [
    { label: 'Patients', value: patientCount, icon: Users, sub: `+${newPatientsThisMonth} this month` },
    { label: 'Doctors', value: doctorCount, icon: Stethoscope, sub: `${receptionistCount} receptionists` },
    { label: 'Pending Appointments', value: statusCounts.PENDING || 0, icon: Calendar, sub: `${statusCounts.CONFIRMED || 0} confirmed` },
    { label: 'Revenue Collected', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, sub: `$${pendingInvoiceTotal.toLocaleString()} pending (${pendingInvoiceCount})` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
            <p className="text-sm text-slate-500 mt-1">Live data from your MediVault database</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/admin/staff"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              Add Doctor / Receptionist
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4" />
              System Settings
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{card.label}</div>
              <div className="text-xs text-slate-400 mt-1.5">{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-500">Low Stock Medicines</h2>
            </div>
            {lowStockMedicines.length === 0 ? (
              <p className="text-sm text-slate-400">All inventory levels are healthy.</p>
            ) : (
              <ul className="space-y-3">
                {lowStockMedicines.map((med) => (
                  <li key={med.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{med.name}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{med.stock} units left</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-emerald-500" />
              <h2 className="font-bold text-sm uppercase tracking-wide text-slate-500">Recent Activity</h2>
            </div>
            {recentAuditLogs.length === 0 ? (
              <p className="text-sm text-slate-400">No activity logged yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentAuditLogs.map((log) => (
                  <li key={log.id} className="flex items-start gap-2.5 text-sm">
                    <Clock className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{log.actor.email}</span>
                      <span className="text-slate-500"> — {log.action.replace(/_/g, ' ').toLowerCase()} </span>
                      <span className="text-slate-400 text-xs">
                        ({new Date(log.createdAt).toLocaleString()})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mt-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-500">Appointment Status</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <div key={status} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
                <div className="text-xl font-bold">{statusCounts[status] || 0}</div>
                <div className="text-xs text-slate-500 mt-0.5">{status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
