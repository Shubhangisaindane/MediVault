import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

// 1. GET - Retrieve invoices
export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    // RBAC check: patients retrieve their own bills only
    if (sessionUser.role === 'PATIENT') {
      if (!sessionUser.patientId) {
        return NextResponse.json({ error: 'No patient profile linked' }, { status: 400 });
      }
      where.patientId = sessionUser.patientId;
    }

    const invoices = await db.invoice.findMany({
      where,
      include: {
        patient: true,
        visit: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 2. POST - Generate Invoice (Receptionist or Admin only)
export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, visitId, amount, tax, discount, dueDate } = body;

    if (!patientId || amount === undefined || !dueDate) {
      return NextResponse.json({ error: 'Missing required billing fields' }, { status: 400 });
    }

    const subtotal = parseFloat(amount);
    const taxValue = tax ? parseFloat(tax) : 0;
    const discountValue = discount ? parseFloat(discount) : 0;
    const total = subtotal + taxValue - discountValue;

    const invoice = await db.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: {
          patientId,
          visitId: visitId || null,
          amount: subtotal,
          tax: taxValue,
          discount: discountValue,
          total,
          status: 'PENDING',
          dueDate: new Date(dueDate)
        }
      });

      // Write audit
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'CREATE_INVOICE',
          entityType: 'Invoice',
          entityId: createdInvoice.id,
          metadata: { patientId, total }
        }
      });

      return createdInvoice;
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 3. PUT - Record Payment on Invoice (Receptionist or Admin only)
export async function PUT(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !['ADMIN', 'RECEPTIONIST'].includes(sessionUser.role)) {
      return NextResponse.json({ error: 'Unauthorized. Staff only.' }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, method, transactionId } = body;

    if (!invoiceId || amount === undefined || !method) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 });
    }

    const paymentAmount = parseFloat(amount);

    const paymentResult = await db.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          method,
          transactionId: transactionId || null
        }
      });

      // 2. Retrieve invoice to calculate if fully paid
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

      // If sum of payments satisfies the invoice total, mark PAID
      let updatedStatus = invoice.status;
      if (totalPaid >= invoice.total) {
        updatedStatus = 'PAID';
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' }
        });
      }

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorUserId: sessionUser.id,
          action: 'RECORD_PAYMENT',
          entityType: 'Payment',
          entityId: payment.id,
          metadata: { invoiceId, amount: paymentAmount, method, invoiceStatus: updatedStatus }
        }
      });

      return { payment, invoiceStatus: updatedStatus };
    });

    return NextResponse.json({ success: true, payment: paymentResult.payment, status: paymentResult.invoiceStatus });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
