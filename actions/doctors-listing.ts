'use server';

import { db } from '@/lib/prisma';

export async function getDoctoryBySpeciality(speciality: string) {
  try {
    const doctors = await db.user.findMany({
      where: {
        role: 'DOCTOR',
        verificationStatus: 'VERIFIED',
        speciality: speciality.split('%20').join(' '),
      },
      orderBy: {
        name: 'asc',
      },
    });

    return { doctors };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching doctors by speciality', error);
      return { error: `Failed to fetch doctor by speciality` };
    }
    throw new Error('Unknown error occured');
  }
}
