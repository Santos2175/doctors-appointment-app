'use server';

import { db } from '@/lib/prisma';
import { getString } from '@/lib/utils';
import { auth } from '@clerk/nextjs/server';
import { addDays, addMinutes, endOfDay, format, isBefore } from 'date-fns';
import { deductCreditsForAppointment } from './credits';
import { revalidatePath } from 'next/cache';
import { Auth } from '@vonage/auth';
import { Vonage } from '@vonage/server-sdk';
import { MediaMode } from '@vonage/video';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  formatted: string;
  day: string;
}

export interface DaySlot {
  date: string;
  displayDate: string;
  slots: TimeSlot[];
}

// For vonage setting
const credentials = new Auth({
  applicationId: process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID,
  privateKey: process.env.VONAGE_PRIVATE_KEY,
});

const vonage = new Vonage(credentials, {});

// Server action to fetch doctor by id
export async function getDoctorById(doctorId: string) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: 'DOCTOR',
        verificationStatus: 'VERIFIED',
      },
    });

    if (!doctor) throw new Error('Doctor Not Found');

    return { doctor };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching doctor by id', error);
      throw new Error(`Error fetching doctor by id: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}

export async function getAvailabilityTimeSlots(doctorId: string) {
  try {
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
        role: 'DOCTOR',
        verificationStatus: 'VERIFIED',
      },
    });

    if (!doctor) {
      throw new Error('Doctor Not Found');
    }

    const availability = await db.availability.findFirst({
      where: {
        doctorId: doctor.id,
        status: 'AVAILABLE',
      },
    });

    if (!availability) {
      throw new Error('No availability set by doctor');
    }

    const now = new Date();
    const days = [now, addDays(now, 1), addDays(now, 2), addDays(now, 3)];

    const lastday = endOfDay(days[3]);

    const existingAppointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: 'SCHEDULED',
        startTime: {
          lte: lastday,
        },
      },
    });

    const availableSlotsByDay: Record<string, TimeSlot[]> = {};

    // For each of next 4 days, generate available slots
    for (const day of days) {
      const dayString = format(day, 'yyyy-MM-dd');
      availableSlotsByDay[dayString] = [];

      // Create a copy of the availability start/end times for this day
      const availabilityStart = new Date(availability.startTime);
      const availabilityEnd = new Date(availability.endTime);

      // Set the day to the current day that we're processing
      availabilityStart.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      availabilityEnd.setFullYear(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      let current = new Date(availabilityStart);
      const end = new Date(availabilityEnd);

      while (
        isBefore(addMinutes(current, 30), end) ||
        +addMinutes(current, 30) === +end
      ) {
        const next = addMinutes(current, 30);

        // Skip past slots
        if (isBefore(current, now)) {
          current = next;
          continue;
        }

        const overlaps = existingAppointments.some((appointment) => {
          const aStart = new Date(appointment.startTime);
          const aEnd = new Date(appointment.endTime);

          return (
            (current >= aStart && current < aEnd) ||
            (next > aStart && next <= aEnd) ||
            (current <= aStart && next >= aEnd)
          );
        });

        if (!overlaps) {
          availableSlotsByDay[dayString].push({
            startTime: current.toISOString(),
            endTime: next.toISOString(),
            formatted: `${format(current, 'h:mm a')} - ${format(
              next,
              'h:mm a'
            )}`,
            day: format(current, 'EEEE MMMM d'),
          });
        }

        current = next;
      }
    }

    // Convert to array of slots grouped by day for easier consumption by UI
    const result: DaySlot[] = Object.entries(availableSlotsByDay).map(
      ([date, slots]) => ({
        date,
        displayDate:
          slots.length > 0
            ? slots[0].day
            : format(new Date(date), 'EEEE MMMM d'),
        slots,
      })
    );

    return { days: result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to fetch available slots', error);
      throw new Error(`Failed to fetch available slots: ${error.message}`);
    }

    throw new Error('Unknown error occured');
  }
}

// Server action to book appointment
export async function bookAppointment(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  try {
    // Get the patient user
    const patient = await db.user.findUnique({
      where: {
        clerkUserId: userId,
        role: 'PATIENT',
      },
    });

    if (!patient) {
      throw new Error('Patient Not Found');
    }

    // Parse form data
    const doctorId = getString(formData.get('doctorId'));
    const startTime = getString(formData.get('startTime'));
    const endTime = getString(formData.get('endTime'));
    const patientDescription = getString(formData.get('description') || null);

    // Validate Input
    if (!doctorId || !startTime || !endTime) {
      throw new Error('doctorId, startTime and endTime are required');
    }

    // Check if doctor exists and is verified
    const doctor = await db.user.findUnique({
      where: {
        id: doctorId!,
        role: 'DOCTOR',
        verificationStatus: 'VERIFIED',
      },
    });

    if (!doctor) {
      throw new Error('Doctor not found or not verified');
    }

    // Check if the patient has the enough credit (2 credit per appointment)
    if (patient.credits < 2) {
      throw new Error('Insufficient credits to book appointments');
    }

    // Check if the requested time slot is available
    const overlappingAppointment = await db.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        status: 'SCHEDULED',
        OR: [
          {
            // New appointment starts during an existing appointment
            startTime: {
              lte: startTime,
            },
            endTime: {
              gt: startTime,
            },
          },
          {
            // New appointment ends during an existing appointment
            startTime: {
              lt: endTime,
            },
            endTime: {
              gte: endTime,
            },
          },
          {
            // New appointment completely overlaps an existing appointment
            startTime: {
              gte: startTime,
            },
            endTime: {
              lte: endTime,
            },
          },
        ],
      },
    });

    if (overlappingAppointment) {
      throw new Error('This time slot is already booked');
    }

    // create vonage video session
    const sessionId = await createVideoSession();

    const { success, error } = await deductCreditsForAppointment(
      patient.id,
      doctor.id
    );

    if (!success) {
      throw new Error(error || 'Failed to deduct credits');
    }

    // Create appointment with the video session id
    const appointment = await db.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        startTime,
        endTime,
        patientDescription,
        status: 'SCHEDULED',
        videoSessionId: sessionId,
      },
    });

    revalidatePath('/appointments');
    return { success: true, appointment };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to book appointment', error);
      throw new Error(`Failed to book appointment: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}

// Server action to create vonage video session
async function createVideoSession(): Promise<string> {
  try {
    const session = await vonage.video.createSession({
      mediaMode: MediaMode.ROUTED,
    });
    return session.sessionId;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to create video session: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}

// Generate a token for a video session
// This will be called when either doctor or patient is about to join the call
export async function generateVideoToken(formData: FormData) {
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

    if (!user) {
      throw new Error('User Not Found');
    }

    const appointmentId = getString(formData.get('appointmentId'));

    if (!appointmentId) {
      throw new Error('Appointment ID is required');
    }

    // Find the appointment
    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
    });

    if (!appointment) {
      throw new Error('Appointment Not Found');
    }

    // Verify if the user is patient or doctor
    if (appointment.patientId !== user.id && appointment.doctorId !== user.id) {
      throw new Error('You are not authorized to join this call');
    }

    // Verify if the appointment is SCHEDULED
    if (appointment.status !== 'SCHEDULED') {
      throw new Error('This appointment is not currently scheduled');
    }

    // Verify the appointment is within the valid time range
    const now: Date = new Date();
    const appointmentTime: Date = new Date(appointment.startTime);
    const timeDifference: number =
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60);

    if (timeDifference > 30) {
      throw new Error(
        'This call will be available 30 minutes before the scheduled time'
      );
    }

    // Generate a token for the video session
    // Token expires in 1 hour after the appointment end time
    const appointmentEndTime = new Date(appointment.endTime);
    const expirationTime =
      Math.floor(appointmentEndTime.getTime() / 1000) + 60 * 60;

    // Use user's role and name as connection data
    const connectionData = JSON.stringify({
      name: user.name,
      role: user.role,
      userId: user.id,
    });

    // Generate token with appropriate role and expiration
    const token = vonage.video.generateClientToken(
      appointment.videoSessionId!,
      {
        role: 'publisher',
        expireTime: expirationTime,
        data: connectionData,
      }
    );

    // Update appointment with token
    await db.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        videoSessionToken: token,
      },
    });

    return { success: true, videoSessionId: appointment.videoSessionId, token };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to generate video session token: ', error);
      throw new Error(
        `Failed to generate video session token: ${error.message}`
      );
    }

    throw new Error('Unknown error occured');
  }
}
