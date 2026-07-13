import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, getSessionUser } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    // Only an existing admin can create staff accounts
    const requester = await getSessionUser();
    if (!requester || requester.role !== Role.ADMIN) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, role } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be ADMIN, DOCTOR, or RECEPTIONIST. Use /signup for patients.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    // Doctor accounts need a linked Doctor profile
    if (role === 'DOCTOR') {
      const { firstName, lastName, specialization, department, phone, availability } = body;

      if (!firstName || !lastName || !specialization || !department) {
        return NextResponse.json(
          { error: 'firstName, lastName, specialization, and department are required for doctor accounts.' },
          { status: 400 }
        );
      }

      const doctor = await db.doctor.create({
        data: {
          firstName,
          lastName,
          specialization,
          department,
          email: normalizedEmail,
          phone: phone || null,
          availability: availability || {},
        },
      });

      const user = await db.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.DOCTOR,
          doctorId: doctor.id,
        },
      });

      return NextResponse.json({ success: true, userId: user.id, doctorId: doctor.id });
    }

    // Admin and Receptionist accounts don't need a linked profile
    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: role === 'ADMIN' ? Role.ADMIN : Role.RECEPTIONIST,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('create-staff error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
