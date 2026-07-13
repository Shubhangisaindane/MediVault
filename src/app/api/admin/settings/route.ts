import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@prisma/client';

// Defaults used whenever a key hasn't been explicitly set yet
const DEFAULT_SETTINGS = {
  clinicName: 'MediVault Clinic',
  supportEmail: 'support@medivault.com',
  appointmentSlotMinutes: '30',
  lowStockThreshold: '50',
  maintenanceMode: 'false',
};

type SettingKey = keyof typeof DEFAULT_SETTINGS;

export async function GET() {
  const requester = await getSessionUser();
  if (!requester || requester.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const rows = await db.systemSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return NextResponse.json({ settings: { ...DEFAULT_SETTINGS, ...stored } });
}

export async function POST(req: NextRequest) {
  const requester = await getSessionUser();
  if (!requester || requester.role !== Role.ADMIN) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const allowedKeys = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

    const updates = allowedKeys
      .filter((key) => key in body)
      .map((key) => {
        const value = String(body[key]);
        return db.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      });

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid settings provided.' }, { status: 400 });
    }

    await db.$transaction(updates);

    // Log who changed settings — useful given this affects the whole app
    await db.auditLog.create({
      data: {
        actorUserId: requester.id,
        action: 'UPDATE_SYSTEM_SETTINGS',
        entityType: 'SystemSetting',
        entityId: 'bulk',
        metadata: body,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update-settings error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
