import React from 'react';
import { getSessionUser } from '@/lib/auth';
import AppointmentScheduler from '@/components/AppointmentScheduler';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function PatientAppointmentsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <AppointmentScheduler 
      userRole={user.role} 
      patientId={user.patientId} 
    />
  );
}
