import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect to correct subroute based on role
  let dashboardPath = '/dashboard/patient';
  if (user.role === 'ADMIN') dashboardPath = '/dashboard/admin';
  else if (user.role === 'DOCTOR') dashboardPath = '/dashboard/doctor';
  else if (user.role === 'RECEPTIONIST') dashboardPath = '/dashboard/receptionist';

  redirect(dashboardPath);
}
