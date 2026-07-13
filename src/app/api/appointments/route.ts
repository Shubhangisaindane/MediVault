import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// Helper to map weekday number to name
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// 1. GET - Retrieve appointments list based on role
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status) where.status = status;

    // RBAC restrictions
    if (sessionUser.role === 'PATIENT' && sessionUser.patientId) {
      where.patientId = sessionUser.patientId;
    } else if (sessionUser.role === 'DOCTOR' && sessionUser.doctorId) {
      where.doctorId = sessionUser.doctorId;
    }

    const appointments = await db.appointmentRequest.findMany({
      where,
      include: {
        patient: true,
        doctor: true
      },
      orderBy: { preferredDate: 'asc' }
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Request / Book an appointment (Patient or Receptionist)
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, doctorId, preferredDate, reason } = body;

    if (!doctorId || !preferredDate || !reason) {
      return NextResponse.json({ error: 'Missing required booking fields' }, { status: 400 });
    }

    // Determine target patient ID
    let targetPatientId = patientId;
    if (sessionUser.role === 'PATIENT') {
      if (!sessionUser.patientId) {
        return NextResponse.json({ error: 'Patient account profile not linked' }, { status: 400 });
      }
      targetPatientId = sessionUser.patientId;
    } else if (!targetPatientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const targetDate = new Date(preferredDate);
    const weekdayName = weekdays[targetDate.getDay()]; // e.g. "Monday"

    // 1. Fetch Doctor availability schedule
    const doctor = await db.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const docAvailability = doctor.availability as Record<string, string[]>;

    // CONFLICT DETECTION 1: Check if doctor is working on that weekday
    if (!docAvailability || !docAvailability[weekdayName]) {
      return NextResponse.json({ 
        error: `Conflict: Dr. ${doctor.lastName} is not scheduled to work on ${weekdayName}s.` 
      }, { status: 409 });
    }

    // CONFLICT DETECTION 2: Check if doctor is already overbooked for that day (e.g. limit to 5 appointments max)
    const dailyAppointmentsCount = await db.appointmentRequest.count({
      where: {
        doctorId,
        preferredDate: {
          gte: new Date(targetDate.setHours(0,0,0,0)),
          lte: new Date(targetDate.setHours(23,59,59,999))
        },
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (dailyAppointmentsCount >= 5) {
      return NextResponse.json({
        error: `Conflict: Dr. ${doctor.lastName} is fully booked on this date. Please select another day.`
      }, { status: 409 });
    }

    // Reset date to clean calendar date
    const finalDate = new Date(preferredDate);
    finalDate.setHours(12, 0, 0, 0); // Midday placeholder

    const appt = await db.$transaction(async (tx) => {
      const createdAppt = await tx.appointmentRequest.create({
        data: {
          patientId: targetPatientId,
          doctorId,
          preferredDate: finalDate,
          reason,
          status: sessionUser.role === 'RECEPTIONIST' ? 'CONFIRMED' : 'PENDING'
        },
        include: { patient: true, doctor: true }
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_APPOINTMENT',
          entityType: 'AppointmentRequest',
          entityId: createdAppt.id,
          metadata: { doctorId, date: finalDate.toISOString() }
        }
      });

      return createdAppt;
    });

    // Notify the doctor's linked portal account, if one exists.
    // Doctor doesn't have a userId field directly — User holds doctorId,
    // so we look it up via the reverse relation.
    const doctorUser = await db.user.findUnique({ where: { doctorId: appt.doctorId } });
    if (doctorUser) {
      await createNotification({
        userId: doctorUser.id,
        title: appt.status === 'CONFIRMED' ? 'New Appointment Booked' : 'New Appointment Request',
        message: `${appt.patient.firstName} ${appt.patient.lastName} requested a booking for ${finalDate.toLocaleDateString('en-US')}.`,
      });
    }

    return NextResponse.json({ success: true, appointment: appt });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. PUT - Reschedule / Confirm / Cancel appointment (Receptionist, Doctor, Admin)
export async function PUT(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, preferredDate, staffNote } = body;

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    const appt = await db.appointmentRequest.findUnique({
      where: { id }
    });

    if (!appt) {
      return NextResponse.json({ error: 'Appointment record not found' }, { status: 404 });
    }

    // RBAC Protection: Patients can only CANCEL their own appointments, cannot confirm them!
    if (sessionUser.role === 'PATIENT') {
      if (appt.patientId !== sessionUser.patientId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      if (status && status !== 'CANCELLED') {
        return NextResponse.json({ error: 'Patients can only cancel bookings.' }, { status: 403 });
      }
    }

    const data: any = {};
    if (status) data.status = status;
    if (staffNote !== undefined) data.staffNote = staffNote;

    if (preferredDate) {
      const finalDate = new Date(preferredDate);
      finalDate.setHours(12, 0, 0, 0);
      data.preferredDate = finalDate;
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.appointmentRequest.update({
        where: { id },
        data,
        include: { patient: true, doctor: true }
      });

      // Write audit
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'UPDATE_APPOINTMENT',
          entityType: 'AppointmentRequest',
          entityId: id,
          metadata: { status, date: preferredDate }
        }
      });

      // If status is updated to COMPLETED, let's auto-create a clinical visit log structure or billing draft if needed!
      return result;
    });

    // Notify whichever side didn't make the change, via their linked portal account.
    if (status === 'CONFIRMED' || status === 'CANCELLED') {
      const dateStr = updated.preferredDate.toLocaleDateString('en-US');

      if (sessionUser.role === 'PATIENT') {
        // Patient cancelled — notify the doctor's account.
        const doctorUser = await db.user.findUnique({ where: { doctorId: updated.doctorId } });
        if (doctorUser) {
          await createNotification({
            userId: doctorUser.id,
            title: 'Appointment Cancelled',
            message: `${updated.patient.firstName} ${updated.patient.lastName} cancelled their appointment on ${dateStr}.`,
          });
        }
      } else {
        // Receptionist/doctor/admin confirmed or cancelled — notify the patient's account.
        const patientUser = await db.user.findUnique({ where: { patientId: updated.patientId } });
        if (patientUser) {
          await createNotification({
            userId: patientUser.id,
            title: status === 'CONFIRMED' ? 'Appointment Confirmed' : 'Appointment Cancelled',
            message: `Your appointment with Dr. ${updated.doctor.lastName} on ${dateStr} was ${status.toLowerCase()}.`,
          });
        }
      }
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}