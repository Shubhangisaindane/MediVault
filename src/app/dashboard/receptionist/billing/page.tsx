import React from 'react';
import { getSessionUser } from '@/lib/auth';
import BillingManager from '@/components/BillingManager';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function ReceptionistBillingPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <BillingManager 
      userRole={user.role} 
    />
  );
}
