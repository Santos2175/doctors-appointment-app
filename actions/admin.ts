'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Server action to check if the user is Admin
export async function verfiyAdmin(): Promise<boolean> {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    return user?.role === 'ADMIN';
  } catch (error: any) {
    console.error('Failed to verify admin: ', error);
    return false;
  }
}

// Server action to get all the pending doctors
export async function getPendingDoctors() {
  const isAdmin = await verfiyAdmin();

  if (!isAdmin) throw new Error('Unauthorized');

  try {
    const pendingDoctors = await db.user.findMany({
      where: {
        role: 'DOCTOR',
        verificationStatus: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { doctors: pendingDoctors };
  } catch (error: any) {
    throw new Error('Failed to fetch pending doctors');
  }
}

// Server action to get verified doctors
export async function getVerifiedDoctors() {
  const isAdmin = await verfiyAdmin();

  if (!isAdmin) throw new Error('Unauthorized');

  try {
    const verifiedDoctors = await db.user.findMany({
      where: {
        role: 'DOCTOR',
        verificationStatus: 'VERIFIED',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return { doctors: verifiedDoctors };
  } catch (error) {
    throw new Error('Failed to fetch verified doctors');
  }
}

// Server action to update the status of doctor
export async function updateDoctorStatus(formData: FormData) {
  const isAdmin = await auth();

  if (!isAdmin) throw new Error('Unauthorized');

  const doctorId = formData.get('doctorId') as string | null;
  const status = formData.get('status') as 'VERIFIED' | 'REJECTED' | null;

  if (!doctorId || !status || !['VERIFIED', 'REJECTED'].includes(status)) {
    throw new Error('Invalid Input');
  }

  try {
    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to update doctor status', error);
      throw new Error(`Failed to update doctor status: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}

// Server action to update active doctor status
export async function updateDoctorActiveStatus(formData: FormData) {
  const isAdmin = await auth();

  if (!isAdmin) throw new Error('Unauthorized');

  const doctorId = formData.get('doctorId') as string | null;
  const suspend = formData.get('suspend') === 'true';

  if (!doctorId) {
    throw new Error('doctorId is required');
  }

  try {
    const status = suspend ? 'PENDING' : 'VERIFIED';

    await db.user.update({
      where: {
        id: doctorId,
      },
      data: {
        verificationStatus: status,
      },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to update doctor status', error);
      throw new Error(`Failed to update doctor status: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}
