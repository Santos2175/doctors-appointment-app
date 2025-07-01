'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Helper to safely get string from FormData
const getString = (value: FormDataEntryValue | null): string => {
  return typeof value === 'string' ? value : '';
};

// Server action to set availabilty slots
export async function setAvailabilitySlots(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: 'DOCTOR',
      },
    });

    if (!doctor) {
      throw new Error('Doctor Not Found');
    }

    // Get Form Data
    const startTime = getString(formData.get('startTime'));
    const endTime = getString(formData.get('endTime'));

    if (!startTime || !endTime) {
      throw new Error('Start time and end time are required');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    const existingSlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
    });

    if (existingSlots.length > 0) {
      const slotsWithNoAppointments = existingSlots.filter(
        (slot) => !slot.appointment
      );

      if (slotsWithNoAppointments.length > 0) {
        await db.availability.deleteMany({
          where: {
            id: {
              in: slotsWithNoAppointments.map((slot) => slot.id),
            },
          },
        });
      }
    }

    // Create new availability slot
    const newSlot = await db.availability.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'AVAILABLE',
      },
    });

    revalidatePath('/doctor');
    return { success: true, slot: newSlot };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to set availablity`, error);
      throw new Error(`Failed to set availablity: ${error.message}`);
    }

    throw new Error('Unknown error occured');
  }
}

// Server action to get availability doctor
export async function getDoctorAvailability() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    const doctor = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: 'DOCTOR',
      },
    });

    if (!doctor) {
      throw new Error('Doctor Not Found');
    }

    const availabilitySlots = await db.availability.findMany({
      where: {
        doctorId: doctor.id,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return { slots: availabilitySlots };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to fetch availability slots`, error);
      throw new Error(`Failed to fetch availabilty slots: ${error.message}`);
    }

    throw new Error('Unknown error occured');
  }
}
