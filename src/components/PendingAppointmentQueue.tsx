'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

type AppointmentRequestItem = {
  id: string;
  reason: string;
  preferredDate: string | Date;
  patient: { firstName: string; lastName: string; mrn: string };
  doctor: { lastName: string };
};

export default function PendingAppointmentQueue({
  requests,
}: {
  requests: AppointmentRequestItem[];
}) {
  const router = useRouter();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (id: string, status: 'CONFIRMED' | 'CANCELLED') => {
    setPendingActionId(id);
    setError(null);

    try {
      await axios.put('/api/appointments', { id, status });
      // Server component fetched this list — refresh so it re-queries and this
      // appointment drops out of the pending queue (or shows up confirmed elsewhere).
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not update this appointment. Please try again.');
    } finally {
      setPendingActionId(null);
    }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 text-sm gap-2">
        <AlertCircle className="h-5 w-5 text-slate-300" />
        <span>No pending appointments in the queue.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex-1">
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {requests.map((req) => (
        <div
          key={req.id}
          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-3"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {req.patient.firstName} {req.patient.lastName}
              </p>
              <p className="text-xs text-slate-400">
                MRN: {req.patient.mrn} &bull; Pref: {new Date(req.preferredDate).toLocaleDateString('en-US')}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Dr. {req.doctor.lastName}
            </span>
          </div>

          <p className="text-xs text-slate-500 bg-white dark:bg-slate-900 border p-2 rounded-lg italic">
            Reason: &quot;{req.reason}&quot;
          </p>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleAction(req.id, 'CONFIRMED')}
              disabled={pendingActionId === req.id}
              className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5"
            >
              {pendingActionId === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Confirm Booking
            </button>
            <button
              onClick={() => handleAction(req.id, 'CANCELLED')}
              disabled={pendingActionId === req.id}
              className="px-3 py-1 border border-slate-200 bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              Cancel
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}