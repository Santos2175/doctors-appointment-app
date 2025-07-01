import { getDoctorAppointments, getDoctorAvailability } from '@/actions/doctor';
import { getCurrentUser } from '@/actions/onboarding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';

import React from 'react';
import AvailabilitySettings from './_components/availability-settings';

const DoctorDashboard = async () => {
  const user = await getCurrentUser();

  const [appointmentsData, availabilityData] = await Promise.all([
    getDoctorAppointments(),
    getDoctorAvailability(),
  ]);

  if (user?.role !== 'DOCTOR') {
    redirect('/onboarding');
  }

  // If not verified, redirect to verification page
  if (user?.verificationStatus !== 'VERIFIED') {
    redirect('/doctor/verfication');
  }

  return (
    <Tabs
      defaultValue='appointments'
      className='grid grid-cols-1 md:grid-cols-4 gap-6'>
      <TabsList className='md:col-span-1 bg-muted/30 border h-14 md:h-28 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0'>
        <TabsTrigger
          value='appointments'
          className='flex-1 w-full md:flex md:items-start md:justify-start md:px-4 md:py-3'>
          <Calendar className='h-4 w-4 hidden md:inline mr-2' />
          Appointments
        </TabsTrigger>
        <TabsTrigger
          value='availability'
          className='flex-1 w-full md:flex md:items-start md:justify-start md:px-4 md:py-3'>
          <Clock className='h-4 w-4 hidden md:inline mr-2' />
          Availability
        </TabsTrigger>
      </TabsList>

      <div className='md:col-span-3'>
        <TabsContent value='appointments' className='border-none p-0 '>
          Appointments
        </TabsContent>
        <TabsContent value='availability' className='border-none p-0 '>
          <AvailabilitySettings slots={availabilityData.slots || []} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default DoctorDashboard;
