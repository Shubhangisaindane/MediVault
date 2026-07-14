import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { normalizeEmail, normalizePhone } from '@/lib/validation';

// 1. GET - Query Patients (Search, Filter, Sort, Paginate)
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sex = searchParams.get('sex') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const skip = (page - 1) * limit;

    // Build filters
    const where: any = {
      deletedAt: null, // Soft delete filter
    };

    if (search) {
      where.OR = [
        { mrn: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sex) {
      where.sex = sex;
    }

    // RBAC: doctors only see patients they've actually treated or have a
    // pending/confirmed booking with — not the full directory.
    if (sessionUser.role === 'DOCTOR') {
      if (!sessionUser.doctorId) {
        return NextResponse.json({ error: 'Doctor account profile not linked' }, { status: 400 });
      }

      where.AND = [
        {
          OR: [
            { appointmentRequests: { some: { doctorId: sessionUser.doctorId } } },
            { visits: { some: { doctorId: sessionUser.doctorId } } },
          ],
        },
      ];
    }

    // Fetch patients and total count
    const [patients, total] = await db.$transaction([
      db.patient.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          visits: {
            orderBy: { visitDate: 'desc' },
            take: 1
          }
        }
      }),
      db.patient.count({ where })
    ]);

    // Write audit log for viewing directories
    await db.auditLog.create({
      data: {
        actorUserId: sessionUser.id,
        action: 'VIEW_PATIENT_DIRECTORY',
        entityType: 'Patient',
        entityId: 'directory',
        metadata: { search, page }
      }
    });

    return NextResponse.json({
      patients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Create Patient Profile
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, dateOfBirth, sex, phone, email, address } = body;

    if (!firstName || !lastName || !dateOfBirth || !sex) {
      return NextResponse.json({ error: 'Required fields are missing' }, { status: 400 });
    }

    const normalizedEmail = email ? normalizeEmail(email) : null;
    if (email && !normalizedEmail) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }
    const normalizedPhone = normalizePhone(phone);
    if (phone !== undefined && phone !== null && phone !== '' && !normalizedPhone) {
      return NextResponse.json({ error: 'Enter a valid phone number with 7 to 15 digits.' }, { status: 400 });
    }

    // Generate unique MRN
    let mrn = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const rand = Math.floor(100000 + Math.random() * 900000);
      mrn = `MRN-${rand}`;
      const existing = await db.patient.findUnique({ where: { mrn } });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique MRN' }, { status: 500 });
    }

    const patient = await db.$transaction(async (tx) => {
      const createdPatient = await tx.patient.create({
        data: {
          mrn,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          sex,
          phone: normalizedPhone,
          email: normalizedEmail,
          address,
          createdById: sessionUser.id
        }
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_PATIENT',
          entityType: 'Patient',
          entityId: createdPatient.id,
          metadata: { mrn, name: `${firstName} ${lastName}` }
        }
      });

      return createdPatient;
    });

    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. DELETE - Bulk Delete Patients
export async function DELETE(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Patient IDs are required' }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // Soft-delete patients
      await tx.patient.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      });

      // De-link users linked to these patient profiles
      await tx.user.updateMany({
        where: { patientId: { in: ids } },
        data: { patientId: null }
      });

      // Log bulk audit activity
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'BULK_DELETE_PATIENTS',
          entityType: 'Patient',
          entityId: 'bulk',
          metadata: { count: ids.length, ids }
        }
      });
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error('Error deleting patients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
