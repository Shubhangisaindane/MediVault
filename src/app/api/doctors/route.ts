import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { normalizeEmail, normalizePhone } from '@/lib/validation';

// 1. GET - List Doctors (optional specialization/department filters)
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'RECEPTIONIST', 'PATIENT', 'DOCTOR'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department') || '';
    const specialization = searchParams.get('specialization') || '';

    const where: any = {};
    if (department) where.department = department;
    if (specialization) where.specialization = specialization;

    const doctors = await db.doctor.findMany({
      where,
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Create Doctor Profile (Admin only)
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      specialization, 
      department, 
      email, 
      phone, 
      availability,
      password // Admin assigns initial password
    } = body;

    if (!firstName || !lastName || !specialization || !department || !email || !password) {
      return NextResponse.json({ error: 'Missing required staff fields' }, { status: 400 });
    }

    const emailLower = normalizeEmail(email);
    if (!emailLower) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const normalizedPhone = normalizePhone(phone);
    if (phone !== undefined && phone !== null && phone !== '' && !normalizedPhone) {
      return NextResponse.json({ error: 'Enter a valid phone number with 7 to 15 digits.' }, { status: 400 });
    }

    // Check if email already used
    const existing = await db.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered to an account' }, { status: 400 });
    }

    // Default availability if empty
    const docAvailability = availability || {
      Monday: ["09:00-17:00"],
      Wednesday: ["09:00-17:00"],
      Friday: ["09:00-17:00"]
    };

    const passwordHash = await hashPassword(password);

    const result = await db.$transaction(async (tx) => {
      // 1. Create Doctor Profile
      const doctor = await tx.doctor.create({
        data: {
          firstName,
          lastName,
          specialization,
          department,
          email: emailLower,
          phone: normalizedPhone,
          availability: docAvailability,
        }
      });

      // 2. Create User Account linked to Doctor
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          role: 'DOCTOR',
          doctorId: doctor.id
        }
      });

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_DOCTOR',
          entityType: 'Doctor',
          entityId: doctor.id,
          metadata: { name: `Dr. ${firstName} ${lastName}`, specialization }
        }
      });

      return { doctor, user };
    });

    return NextResponse.json({ success: true, doctor: result.doctor });
  } catch (error: any) {
    console.error('Error creating doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. DELETE - Delete Doctor Profile (Admin only)
export async function DELETE(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admins only.' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // Delete user account first due to cascade, or let cascade handle it.
      // In prisma, we configured onDelete: Cascade, so deleting the doctor deletes the user.
      await tx.doctor.delete({
        where: { id }
      });

      // Log action
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'DELETE_DOCTOR',
          entityType: 'Doctor',
          entityId: id,
          metadata: { deletedId: id }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
