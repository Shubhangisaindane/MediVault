import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, dateOfBirth, sex, phone, address } = body;

    // Validation
    if (!email || !password || !firstName || !lastName || !dateOfBirth || !sex) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Generate unique MRN (Medical Record Number)
    let mrn = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      mrn = `MRN-${rand}`;

      const existingPatient = await db.patient.findUnique({
        where: { mrn },
      });

      if (!existingPatient) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate a unique MRN. Please try again.' },
        { status: 500 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Run in a Prisma transaction to ensure both patient and user are created or none
    const result = await db.$transaction(async (tx) => {
      // 1. Create Patient Record
      const patient = await tx.patient.create({
        data: {
          mrn,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          sex,
          phone,
          email: emailLower,
          address,
          createdById: 'self-signup',
        },
      });

      // 2. Create User Account
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          role: 'PATIENT',
          patientId: patient.id,
        },
      });

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'SIGNUP',
          entityType: 'User',
          entityId: user.id,
          metadata: { mrn, email: emailLower },
        },
      });

      return { user, patient };
    });

    // Create session
    await createSession(result.user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        patientId: result.patient.id,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
