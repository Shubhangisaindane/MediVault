import argon2 from 'argon2';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from './db';
import { Role } from '@prisma/client';

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  patientId: string | null;
  doctorId: string | null;
  firstName: string;
  lastName: string;
};

// 1. Password Hashing Utilities
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch (error) {
    return false;
  }
}

// 2. Session Utilities (DB-backed, secure hashed cookies)
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  // Save session to DB
  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  // Set secure HTTP-only cookie using Next.js 16 Async Cookies API
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

// Wrapped in React's cache() so multiple calls within the same server
// request (e.g. layout.tsx + page.tsx both calling getSessionUser)
// share a single DB query instead of firing one each.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (!token) return null;

    // Hash the token to look it up in DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            patient: true,
            doctor: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await db.session.delete({ where: { id: session.id } });
      const store = await cookies();
      store.delete('session');
      return null;
    }

    const { user } = session;
    let firstName = 'Staff';
    let lastName = 'User';

    if (user.role === Role.PATIENT && user.patient) {
      firstName = user.patient.firstName;
      lastName = user.patient.lastName;
    } else if (user.role === Role.DOCTOR && user.doctor) {
      firstName = user.doctor.firstName;
      lastName = user.doctor.lastName;
    } else if (user.role === Role.ADMIN) {
      firstName = 'System';
      lastName = 'Admin';
    } else if (user.role === Role.RECEPTIONIST) {
      firstName = 'Clinic';
      lastName = 'Receptionist';
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      patientId: user.patientId,
      doctorId: user.doctorId,
      firstName,
      lastName,
    };
  } catch (error) {
    console.error('Error fetching session user:', error);
    return null;
  }
});

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;

    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await db.session.deleteMany({
        where: { tokenHash },
      });
    }

    cookieStore.delete('session');
  } catch (error) {
    console.error('Error destroying session:', error);
  }
}