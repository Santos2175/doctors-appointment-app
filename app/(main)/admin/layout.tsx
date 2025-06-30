import { verfiyAdmin } from '@/actions/admin';
import PageHeader from '@/components/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ShieldCheck, Users } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React, { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin Settings - MediMeet',
  description: 'Manage doctors, patients and platform settings',
};

const AdminPageLayout = async ({
  children,
}: Readonly<{ children: ReactNode }>) => {
  // Verify admin
  const isAdmin = await verfiyAdmin();

  if (!isAdmin) {
    redirect('/onboarding');
  }
  return (
    <div className='container mx-auto px-4 py-8'>
      <PageHeader icon={<ShieldCheck />} title='Admin Setting' />

      <Tabs
        defaultValue='pending'
        className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <TabsList className='md:col-span-1 bg-muted/30 border h-14 md:h-28 flex sm:flex-row md:flex-col w-full p-2 md:p-1 rounded-md md:space-y-2 sm:space-x-2 md:space-x-0'>
          <TabsTrigger
            value='pending'
            className='flex-1 md:flex md:items-center md:justify-start md:px-4 md:py-3 w-full'>
            <AlertCircle className='h-4 w-4 mr-2 hidden md:inline' />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger
            value='doctors'
            className='flex-1 w-full md:flex md:items-center md:justify-start md:px-4 md:py-3'>
            <Users className='h-4 w-4 mr-2 hidden md:inline' />
            <span>Doctors</span>
          </TabsTrigger>
        </TabsList>

        <div className='md:col-span-3'>{children}</div>
      </Tabs>
    </div>
  );
};

export default AdminPageLayout;
