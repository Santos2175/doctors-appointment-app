import { Prisma } from '@/lib/generated/prisma';
import { db } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { format } from 'date-fns';
import { revalidatePath } from 'next/cache';

type UserWithTransactions = Prisma.UserGetPayload<{
  include: { transactions: true };
}>;

// Define credit allocations per plan
const PLAN_CREDITS = {
  free_user: 0,
  standard: 10,
  premium: 24,
};

// Credit cost per appointment
const APPOINTMENT_CREDIT_COST = 2;

export async function checkAndAllocateCredits(user: UserWithTransactions) {
  try {
    if (!user) {
      return null;
    }

    // Only allocate credits for patients
    if (user.role !== 'PATIENT') {
      return user;
    }

    // Check if user has subscription
    const { has } = await auth();

    // Check what subscription user has
    const hasBasic = has({ plan: 'free_user' });
    const hasStandard = has({ plan: 'standard' });
    const hasPremium = has({ plan: 'premium' });

    let currentPlan = null;
    let creditsToAllocate = 0;

    if (hasPremium) {
      currentPlan = 'premium';
      creditsToAllocate = PLAN_CREDITS.premium;
    } else if (hasStandard) {
      currentPlan = 'standard';
      creditsToAllocate = PLAN_CREDITS.standard;
    } else if (hasBasic) {
      currentPlan = 'free_user';
      creditsToAllocate = PLAN_CREDITS.free_user;
    }

    // If user doesn't have any plans, return user
    if (!currentPlan) {
      return user;
    }

    // Check if we already allocated plans for this month
    const currentMonth = format(new Date(), 'yyyy-MM');

    // If there is a transaction this month, if the transaction plan is same
    if (user.transactions.length > 0) {
      const latestTransaction = user.transactions[0];
      const transactionMonth = format(
        new Date(latestTransaction.createdAt),
        'yyyy-MM'
      );
      const transactionPlan = latestTransaction.packageId;

      //  If we already allocated credits for this month and plan is same, return user
      if (
        currentMonth === transactionMonth &&
        transactionPlan === currentPlan
      ) {
        return user;
      }
    }

    // Allocate credits and create transaction record
    const updatedUser = await db.$transaction(async (tx) => {
      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: creditsToAllocate,
          type: 'CREDIT_PURCHASE',
          packageId: currentPlan,
        },
      });

      // Update users credit balance
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          credits: {
            increment: creditsToAllocate,
          },
        },
      });

      return updatedUser;
    });

    // Revalidate relevant paths to reflect updated credit balance
    revalidatePath('/doctors');
    revalidatePath('/appointments');

    return updatedUser;
  } catch (error: any) {
    console.error('Failed to check subscription and credits', error.message);

    return null;
  }
}

export async function deductCreditsForAppointment(
  patientId: string,
  doctorId: string
) {
  try {
    const patient = await db.user.findUnique({
      where: {
        id: patientId,
      },
    });

    const doctor = await db.user.findUnique({
      where: {
        id: doctorId,
      },
    });

    if (!patient) {
      throw new Error('Patient Not Found');
    }

    if (patient?.credits && patient.credits < APPOINTMENT_CREDIT_COST) {
      throw new Error('Insufficient credits to book appointment');
    }

    if (!doctor) {
      throw new Error('Doctor Not Found');
    }

    const result = await db.$transaction(async (tx) => {
      // Create credit transaction for patient(deduction)
      await tx.creditTransaction.create({
        data: {
          userId: patient.id,
          amount: -APPOINTMENT_CREDIT_COST,
          type: 'APPOINTMENT_DEDUCTION',
          // description:`Credits deducted for appointment with Dr. ${doctor.name}`
        },
      });

      // Create credit transaction for doctor (addition)
      await tx.creditTransaction.create({
        data: {
          userId: doctor.id,
          amount: APPOINTMENT_CREDIT_COST,
          type: 'APPOINTMENT_DEDUCTION',
        },
      });

      // Update patient's credit balance(deuction)
      const updatedPatient = await tx.user.update({
        where: {
          id: patient.id,
        },
        data: {
          credits: {
            decrement: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      // Update doctor's credit balance (increment)
      await tx.user.update({
        where: {
          id: doctor.id,
        },
        data: {
          credits: {
            increment: APPOINTMENT_CREDIT_COST,
          },
        },
      });

      return updatedPatient;
    });

    return { success: true, user: result };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    throw new Error('Unknown error occured');
  }
}
