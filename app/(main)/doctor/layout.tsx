import PageHeader from '@/components/page-header';
import { Stethoscope } from 'lucide-react';
import { Metadata } from 'next';
import React, { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Doctor Dashboard - MediMeet',
  description: 'Manage your appointments and availability',
};

const DoctorDashboardLayout = ({
  children,
}: Readonly<{ children: ReactNode }>) => {
  return (
    <div className='container mx-auto px-4 py-8'>
      <PageHeader icon={<Stethoscope />} title='Doctor Dashboard' />
      {children}
    </div>
  );
};

export default DoctorDashboardLayout;
