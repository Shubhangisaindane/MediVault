import React from 'react';
import { getSessionUser } from '@/lib/auth';
import PrescriptionList from '@/components/PrescriptionList';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function PatientPrescriptionsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <PrescriptionList 
      userRole={user.role} 
    />
  );
}
