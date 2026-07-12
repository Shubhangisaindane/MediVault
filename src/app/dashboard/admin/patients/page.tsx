import React from 'react';
import { getSessionUser } from '@/lib/auth';
import PatientDirectory from '@/components/PatientDirectory';

export const revalidate = 0;

export default async function AdminPatientsPage() {
  const user = await getSessionUser();
  return <PatientDirectory userRole={user?.role || 'ADMIN'} />;
}
