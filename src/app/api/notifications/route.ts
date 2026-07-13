import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // adjust to your actual prisma client export path
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20, // keep the dropdown light; add pagination later if needed
  });

  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
