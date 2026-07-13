import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import SettingsForm from './SettingsForm';

export default async function SystemSettingsPage() {
  const user = await getSessionUser();

  if (!user) redirect('/login');
  if (user.role !== Role.ADMIN) redirect('/dashboard');

  return <SettingsForm />;
}
