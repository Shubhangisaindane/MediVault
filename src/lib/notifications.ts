import { db } from '@/lib/db'; // adjust to your actual prisma client export path

/**
 * Central helper for creating a notification for a single user.
 * Call this from wherever a real event happens — e.g. after an
 * appointment request is created, a role is changed, a prescription
 * is written, etc. Do NOT create notifications directly with
 * db.notification.create in route handlers; funnel them through here
 * so the shape/behavior stays consistent everywhere.
 */
export async function createNotification({
  userId,
  title,
  message,
}: {
  userId: string;
  title: string;
  message: string;
}) {
  return db.notification.create({
    data: { userId, title, message },
  });
}

/**
 * Convenience for notifying every user with a given role
 * (e.g. all ADMINs when an audit-worthy event happens).
 */
export async function createNotificationForRole({
  role,
  title,
  message,
}: {
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
  title: string;
  message: string;
}) {
  const users = await db.user.findMany({
    where: { role },
    select: { id: true },
  });

  if (users.length === 0) return [];

  await db.notification.createMany({
    data: users.map((u) => ({ userId: u.id, title, message })),
  });
}
