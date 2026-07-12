import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// GET - List medicines in pharmacy stock
export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const medicines = await db.medicine.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ medicines });
  } catch (error) {
    console.error('Error fetching medicines inventory:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
