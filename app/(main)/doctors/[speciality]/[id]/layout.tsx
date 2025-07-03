import { getDoctorById } from '@/actions/appointment';
import PageHeader from '@/components/page-header';
import { redirect } from 'next/navigation';
import React, { ReactNode } from 'react';

type Params = {
  id: string;
};

type DoctorProfileLayoutProps = {
  children: ReactNode;
  params: Params;
};

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const { doctor } = await getDoctorById(id);

  return {
    title: `Dr. ${doctor.name} - MediMeet`,
    description: `Book an appointment with Dr. ${doctor.name}, ${doctor.speciality} specialist with ${doctor.experience} years of experience`,
  };
}

const DoctorProfileLayout = async ({
  children,
  params,
}: DoctorProfileLayoutProps) => {
  const { id } = await params;

  const { doctor } = await getDoctorById(id);

  if (!doctor) redirect('/doctors');

  return (
    <div className='container mx-auto'>
      <PageHeader
        title={`Dr. ${doctor.name}`}
        backLink={`/doctors/${doctor.speciality}`}
        backLabel={`Back to ${doctor.speciality}`}
      />
      {children}
    </div>
  );
};

export default DoctorProfileLayout;
