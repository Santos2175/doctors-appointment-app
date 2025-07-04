'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function getPatientAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const patient = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: 'PATIENT',
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      throw new Error('Patient Not Found');
    }

    const appointments = await db.appointment.findMany({
      where: {
        patientId: patient.id,
      },
      include: {
        doctor: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return { appointments };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to get patient appointments: `, error);
      return { error: error.message };
    }
    return { error: 'Unknown error occured' };
  }
}
