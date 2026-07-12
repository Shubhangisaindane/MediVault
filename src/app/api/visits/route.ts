import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// 1. GET - Fetch patient visits (clinical summaries)
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Security check: patients can only read their own folder
    if (sessionUser.role === 'PATIENT' && sessionUser.patientId !== patientId) {
      return NextResponse.json({ error: 'Access denied to this health folder' }, { status: 403 });
    }

    // Staff check: must be staff
    if (sessionUser.role === 'PATIENT' === false && !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const visits = await db.visit.findMany({
      where: { patientId },
      include: {
        doctor: true,
      },
      orderBy: { visitDate: 'desc' },
    });

    // Write audit log trail for reading patient folder
    await db.auditLog.create({
      data: {
        actorUserId: sessionUser.id,
        action: 'VIEW_PATIENT_MEDICAL_FOLDER',
        entityType: 'Patient',
        entityId: patientId,
        metadata: { visitsCount: visits.length }
      }
    });

    return NextResponse.json({ visits });
  } catch (error: any) {
    console.error('Error fetching clinical visits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Log new clinical visit (Doctors only)
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'DOCTOR' || !sessionUser.doctorId) {
      return NextResponse.json({ error: 'Unauthorized. Doctors only.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      patientId, 
      temperatureC, 
      bloodPressureSystolic, 
      bloodPressureDiastolic, 
      heartRate, 
      weightKg, 
      heightCm, 
      diagnosis, 
      notes 
    } = body;

    if (!patientId || !notes) {
      return NextResponse.json({ error: 'Patient ID and clinical notes are required' }, { status: 400 });
    }

    const visit = await db.$transaction(async (tx) => {
      const createdVisit = await tx.visit.create({
        data: {
          patientId,
          doctorId: sessionUser.doctorId!,
          temperatureC: temperatureC ? parseFloat(temperatureC) : null,
          bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic, 10) : null,
          bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic, 10) : null,
          heartRate: heartRate ? parseInt(heartRate, 10) : null,
          weightKg: weightKg ? parseFloat(weightKg) : null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          diagnosis,
          notes,
        }
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_CLINICAL_VISIT',
          entityType: 'Visit',
          entityId: createdVisit.id,
          metadata: { patientId, diagnosis }
        }
      });

      return createdVisit;
    });

    return NextResponse.json({ success: true, visit });
  } catch (error: any) {
    console.error('Error logging clinical visit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
