import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import StaffForm from './StaffForm';

export default async function CreateStaffPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }
  if (user.role !== Role.ADMIN) {
    redirect('/dashboard');
  }

  return <StaffForm />;
}
