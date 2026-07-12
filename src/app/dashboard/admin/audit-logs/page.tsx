import React from 'react';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { FileLock, Clock, ShieldAlert } from 'lucide-react';

export const revalidate = 0;

export default async function AdminAuditLogsPage() {
  const user = await getSessionUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all audit logs
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      actor: true
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">System Audit logs</h1>
        <p className="text-slate-500 text-xs mt-0.5">Explore security events, database writes, and compliance logs.</p>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <FileLock className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold">System Compliance Logs Roster</h3>
          </div>
          <span className="text-[10px] font-bold px-3 py-1 bg-emerald-500/10 text-emerald-700 rounded-full flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {logs.length} logs recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor User</th>
                <th className="p-3">User Role</th>
                <th className="p-3">Action logged</th>
                <th className="p-3">Target Entity</th>
                <th className="p-3">Metadata Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    No compliance logs recorded in the database yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 text-slate-400 font-mono">{log.createdAt.toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{log.actor.email}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {log.actor.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/5 dark:text-emerald-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {log.entityType} ({log.entityId.slice(0, 8)})
                    </td>
                    <td className="p-3">
                      {log.metadata ? (
                        <pre className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 border rounded-lg overflow-x-auto max-w-xs font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
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
