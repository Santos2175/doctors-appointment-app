'use server';

import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Dribbble } from 'lucide-react';
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
      // const slotsWithNoAppointments = existingSlots.filter(
      //   (slot) => !slot.appointment
      // );
      // const slotsWithNoAppointments: typeof existingSlots = [];

      // for (const slot of existingSlots) {
      //   const matchingAppointment = await db.appointment.findFirst({
      //     where: {
      //       doctorId: doctor.id,
      //       startTime: slot.startTime,
      //       endTime: slot.endTime,
      //     },
      //   });

      //   if (!matchingAppointment) {
      //     slotsWithNoAppointments.push(slot);
      //   }
      // }

      // if (slotsWithNoAppointments.length > 0) {
      //   await db.availability.deleteMany({
      //     where: {
      //       id: {
      //         in: slotsWithNoAppointments.map((slot) => slot.id),
      //       },
      //     },
      //   });
      // }

      // Optimized version
      const bookedSlots = await db.appointment.findMany({
        where: {
          doctorId: doctor.id,
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      // Delete availability slots not matching any booked slots
      await db.availability.deleteMany({
        where: {
          doctorId: doctor.id,
          NOT: {
            OR: bookedSlots.map((slot) => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
          },
        },
      });
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

// Server action to get doctor appointments
export async function getDoctorAppointments() {
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

    const appointments = await db.appointment.findMany({
      where: {
        doctorId: doctor.id,
        status: {
          in: ['SCHEDULED'],
        },
      },
      include: {
        patient: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return { appointments };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching doctor's appointments`, error);
      throw new Error(`Error fetching doctor's appointments: ${error.message}`);
    }
    throw new Error('Unknown Error occured');
  }
}

// Server action to cancel appointment: can be done by both patient and doctor
export async function cancelAppointment(formData: FormData) {
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
      throw new Error('appointmentId  is required');
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment Not Found');
    }

    // Verify the user is doctor or patient for this appointment
    if (appointment.doctorId !== user.id && appointment.patientId !== user.id) {
      throw new Error('You are not authorized to cancel this appointment');
    }

    // Perform cancellation in transaction
    await db.$transaction(async (tx) => {
      // Update appointment status to be cancelled
      await tx.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Always refund the patient and refund doctors
      // Create credit transaction for patient (refund)
      await tx.creditTransaction.create({
        data: {
          userId: appointment.patientId,
          amount: 2,
          type: 'APPOINTMENT_DEDUCTION',
        },
      });

      // Create credit transaction for doctor (deduct)
      await tx.creditTransaction.create({
        data: {
          userId: appointment.doctorId,
          amount: -2,
          type: 'APPOINTMENT_DEDUCTION',
        },
      });

      // Update patients credit balance
      await tx.user.update({
        where: {
          id: appointment.patientId,
        },
        data: {
          credits: {
            increment: 2,
          },
        },
      });

      // Update doctors credit balance
      await tx.user.update({
        where: {
          id: appointment.doctorId,
        },
        data: {
          credits: {
            decrement: 2,
          },
        },
      });
    });

    // Determine which path to revalidate based on user data
    if (user.role === 'DOCTOR') {
      revalidatePath('/doctor');
    } else if (user.role === 'PATIENT') {
      revalidatePath('/appointments');
    }

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to cancel appointment:', error);
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }
    throw new Error('Unknown error occured');
  }
}

// Add notes to appointment
export async function addNotesToAppointment(formdData: FormData) {
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

    const appointmentId = getString(formdData.get('appointmentId'));
    const notes = getString(formdData.get('notes'));

    if (!appointmentId || !notes) {
      throw new Error('Appointment id and notes are required');
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
    });

    if (!appointment) {
      throw new Error('Appointment Not Found');
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        notes,
      },
    });

    revalidatePath('/doctor');
    return { success: true, appointment: updatedAppointment };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error adding notes to appoinment', error);
      throw new Error(`Error adding notes to appointment: ${error.message}`);
    }

    throw new Error('Unknown error occured');
  }
}

// Mark an appointment as completed: Only by doctor after endTime
export async function markAppointmentCompleted(formData: FormData) {
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

    const appointmentId = getString(formData.get('appointmentId'));
    if (!appointmentId) {
      throw new Error('Appointment id is required');
    }

    const appointment = await db.appointment.findUnique({
      where: {
        id: appointmentId,
        doctorId: doctor.id,
      },
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      throw new Error('Appointment Not Found');
    }

    // Check if appointment is currently SCHEDULED
    if (appointment.status !== 'SCHEDULED') {
      throw new Error('Only scheduled appointment can be marked as completed');
    }

    // Check if current time is after the appointment end time
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      throw new Error(
        'Cannot mark appointment as completed before the scheduled end time'
      );
    }

    const updatedAppointment = await db.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: 'COMPLETED',
      },
    });

    revalidatePath('/doctor');
    return { success: true, appointment: updatedAppointment };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Failed to mark appointment as completed', error);
      throw new Error(
        `Failed to mark appointment as completed: ${error.message}`
      );
    }
    throw new Error('Unknown error occured');
  }
}
