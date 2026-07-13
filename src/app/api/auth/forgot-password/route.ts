import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // This exact response is returned whether or not the account exists,
    // so the endpoint can't be used to check which emails are registered.
    const genericResponse = NextResponse.json({
      success: true,
      message: "If an account exists for that email, we've sent password reset instructions.",
    });

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return genericResponse;
    }

    // Invalidate any previous unused reset tokens for this user before issuing a new one
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetLink);

    return genericResponse;
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
