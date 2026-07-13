import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // adjust to your actual prisma client export path
import { getSessionUser } from '@/lib/auth';

/**
 * Marks all of the current user's notifications as read.
 * If you later want per-notification "mark read" (e.g. clicking
 * a single item), add a variant that accepts { id } in the body
 * and scopes the update to that one row + userId.
 */
export async function POST() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
