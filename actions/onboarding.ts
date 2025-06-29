'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Helper to safely get string from FormData
const getString = (value: FormDataEntryValue | null): string => {
  return typeof value === 'string' ? value : '';
};

// Server action to set user role
export async function setUserRole(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Find user in database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error('User not found');

  const role = getString(formData.get('role'));

  if (!role || !['DOCTOR', 'PATIENT'].includes(role)) {
    throw new Error('Invalid role selection');
  }

  try {
    if (role === 'PATIENT') {
      await db.user.update({
        where: { clerkUserId: userId },
        data: {
          role: 'PATIENT',
        },
      });

      revalidatePath('/');
      return { success: true, redirect: '/doctors' };
    }

    if (role === 'DOCTOR') {
      const speciality = getString(formData.get('speciality'));
      const credentialUrl = getString(formData.get('credentialUrl'));
      const description = getString(formData.get('description'));
      const experience = parseInt(getString(formData.get('experience')), 10);

      if (!speciality || !experience || !credentialUrl || !description) {
        throw new Error('All fields are required');
      }

      await db.user.update({
        where: {
          clerkUserId: userId,
        },
        data: {
          role: 'DOCTOR',
          speciality,
          experience,
          crediantialUrl: credentialUrl,
          description,
          verificationStatus: 'PENDING',
        },
      });

      revalidatePath('/');
      return { success: true, redirect: '/doctor/verification' };
    }
  } catch (error: any) {
    console.error('Failed to set user roles', error);
    throw new Error(`Failed to set user profile: ${error.message}`);
  }
}

// Server action to get current user
export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user;
  } catch (error) {
    console.error('Failed to fetch user information', error);
    return null;
  }
}
