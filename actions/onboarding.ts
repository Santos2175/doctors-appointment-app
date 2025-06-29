import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Server action to set user role
export async function setUserRole(formData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Find user in database
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error('User not found');

  const role = formData.get('role');

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
      const speciality = formData.get('speciality');
      const experience = parseInt(formData.get('experience'), 10);
      const crediantialUrl = formData.get('credentialUrl');
      const description = formData.get('description');

      if (!speciality || !experience || !crediantialUrl || !description) {
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
          crediantialUrl,
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
