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

    // Check if a login already exists for this email
    const existingUser = await db.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check whether staff (receptionist/admin) already created a Patient
    // profile for this email during in-clinic intake, before this person
    // ever signed up online. If so, link to that existing chart instead of
    // creating a second, empty duplicate — keeps visit/prescription/billing
    // history attached to one record instead of splitting it across two.
    const existingPatient = await db.patient.findFirst({
      where: { email: emailLower, deletedAt: null },
      include: { userAccount: true },
    });

    const canLinkExistingPatient = existingPatient && !existingPatient.userAccount;

    // Hash password
    const passwordHash = await hashPassword(password);

    const result = await db.$transaction(async (tx) => {
      let patient = existingPatient;

      if (canLinkExistingPatient) {
        // Reuse the staff-created record as-is — don't overwrite clinical
        // history or demographics with whatever the person just typed.
        patient = existingPatient;
      } else {
        // No existing chart to link — create a new one, same as before.
        let mrn = '';
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
          const rand = Math.floor(100000 + Math.random() * 900000);
          mrn = `MRN-${rand}`;

          const existingMrn = await tx.patient.findUnique({ where: { mrn } });
          if (!existingMrn) isUnique = true;
          attempts++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate a unique MRN. Please try again.');
        }

        patient = await tx.patient.create({
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
          include: {
            userAccount: true, // keeps the return type consistent with existingPatient above (will just be null here)
          },
        });
      }

      // Create User Account, linked to whichever Patient record we ended up with
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          role: 'PATIENT',
          patientId: patient!.id,
        },
      });

      // Audit log — note when this signup linked to a pre-existing chart
      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: canLinkExistingPatient ? 'SIGNUP_LINKED_EXISTING_PATIENT' : 'SIGNUP',
          entityType: 'User',
          entityId: user.id,
          metadata: { mrn: patient!.mrn, email: emailLower, linkedExisting: !!canLinkExistingPatient },
        },
      });

      return { user, patient: patient! };
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
