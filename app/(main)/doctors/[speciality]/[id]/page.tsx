import { getAvailabilityTimeSlots, getDoctorById } from '@/actions/appointment';
import { redirect } from 'next/navigation';
import React from 'react';
import DoctorProfile from './_components/doctor-profile';

type DoctorProfilePageProps = {
  params: {
    id: string;
  };
};

const DoctorProfilePage = async ({ params }: DoctorProfilePageProps) => {
  const { id } = await params;

  try {
    const [doctorData, slotsData] = await Promise.all([
      getDoctorById(id),
      getAvailabilityTimeSlots(id),
    ]);

    return (
      <DoctorProfile
        doctor={doctorData.doctor}
        availableDays={slotsData.days || []}
      />
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error loading doctor's profile page:`, error.message);
      redirect('/doctors');
    }
  }
};

export default DoctorProfilePage;
