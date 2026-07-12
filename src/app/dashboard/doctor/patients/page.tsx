import React from 'react';
import { getSessionUser } from '@/lib/auth';
import PatientDirectory from '@/components/PatientDirectory';

export const revalidate = 0;

export default async function DoctorPatientsPage() {
  const user = await getSessionUser();
  return <PatientDirectory userRole={user?.role || 'DOCTOR'} />;
}
