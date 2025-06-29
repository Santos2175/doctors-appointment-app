'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stethoscope, User } from 'lucide-react';

const doctorFormSchema = z.object({
  speciality: z.string().min(1, 'Speciality is required'),
  experience: z
    .number()
    .min(1, 'Experience must be at least 1 year')
    .max(70, 'Experience must be less than 70 years'),
  credentialUrl: z
    .string()
    .url('Pleas enter a valid url')
    .min(1, 'Credential Url is required'),
  description: z
    .string()
    .min(10, 'Description must be at least 20 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
});

const OnboardingPage = () => {
  const [step, setStep] = useState<string>('choose-role');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      speciality: '',
      experience: undefined,
      credentialUrl: '',
      description: '',
    },
  });

  const specialityValue = watch('speciality');

  if (step === 'choose-role') {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* PATIENT CARD */}
        <Card className='border-emerald-900/20 hover:border-emerald-700/60 cursor-pointer transition-all'>
          <CardContent className='py-6 flex flex-col items-center text-center'>
            <div className='p-4 bg-emerald-900/20 rounded-full mb-4'>
              <User className='h-8 w-8 text-emerald-400' />
            </div>
            <CardTitle className='text-xl font-semibold text-white mb-2'>
              Join as a Patient
            </CardTitle>
            <CardDescription className='mb-4'>
              Book appointments, consult doctors, and manage your healthcare
              journey
            </CardDescription>
            <Button className='w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'>
              Continue as a Patient
            </Button>
          </CardContent>
        </Card>

        {/* DOCTOR CARD */}
        <Card className='border-emerald-900/20 hover:border-emerald-700/60 cursor-pointer transition-all'>
          <CardContent className='py-6 flex flex-col items-center text-center'>
            <div className='p-4 bg-emerald-900/20 rounded-full mb-4'>
              <Stethoscope className='h-8 w-8 text-emerald-400' />
            </div>
            <CardTitle className='text-xl font-semibold text-white mb-2'>
              Join as a Doctor
            </CardTitle>
            <CardDescription className='mb-4'>
              Create your professional profile, set your availability, and
              provide consultations
            </CardDescription>
            <Button className='w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'>
              Continue as a Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'doctor-role') {
    return <>Doctor Form</>;
  }
};

export default OnboardingPage;
