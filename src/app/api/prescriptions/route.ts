import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// 1. GET - Fetch prescriptions
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    const where: any = {};
    if (patientId) where.patientId = patientId;

    // Security check: patients only read theirs
    if (sessionUser.role === 'PATIENT') {
      if (!sessionUser.patientId) {
        return NextResponse.json({ error: 'No patient profile linked' }, { status: 400 });
      }
      where.patientId = sessionUser.patientId;
    }

    const prescriptions = await db.prescription.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
        items: {
          include: {
            medicine: true
          }
        },
        visit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Write a new prescription (Doctors only)
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== 'DOCTOR' || !sessionUser.doctorId) {
      return NextResponse.json({ error: 'Unauthorized. Doctors only.' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, visitId, instructions, items } = body;

    // Validation
    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Patient ID and prescription items are required' }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Create Prescription master record
      const prescription = await tx.prescription.create({
        data: {
          patientId,
          doctorId: sessionUser.doctorId!,
          visitId: visitId || null,
          instructions
        }
      });

      // 2. Create Prescription Items & adjust inventory stock
      for (const item of items) {
        const { medicineId, dosage, frequency, duration } = item;

        if (!medicineId || !dosage || !frequency || !duration) {
          throw new Error('Incomplete prescription item details');
        }

        // Check medicine stock
        const medicine = await tx.medicine.findUnique({
          where: { id: medicineId }
        });

        if (!medicine) {
          throw new Error('Medicine not found in inventory');
        }

        if (medicine.stock < 1) {
          throw new Error(`Out of Stock: ${medicine.name} is currently unavailable.`);
        }

        // Create line item
        await tx.prescriptionItem.create({
          data: {
            prescriptionId: prescription.id,
            medicineId,
            dosage,
            frequency,
            duration
          }
        });

        // Decrement stock (arbitrary subtraction of 1 pack per prescription item for demo)
        await tx.medicine.update({
          where: { id: medicineId },
          data: {
            stock: {
              decrement: 1
            }
          }
        });
      }

      // 3. Write Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_PRESCRIPTION',
          entityType: 'Prescription',
          entityId: prescription.id,
          metadata: { patientId, itemsCount: items.length }
        }
      });

      return prescription;
    });

    return NextResponse.json({ success: true, prescription: result });
  } catch (error: any) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
