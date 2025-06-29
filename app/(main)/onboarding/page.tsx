'use client';

import React, { useEffect, useState } from 'react';
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
import { Loader2, Stethoscope, User } from 'lucide-react';
import useFetch from '@/hooks/use-fetch';
import { setUserRole } from '@/actions/onboarding';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { SPECIALTIES } from '@/lib/specialities';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

type DoctorFormData = z.infer<typeof doctorFormSchema>;

const OnboardingPage = () => {
  const [step, setStep] = useState<string>('choose-role');
  const router = useRouter();
  const { data, fn: submitUserRole, loading } = useFetch(setUserRole);

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

  // Patient submit handler
  const handlePatientSelection = async () => {
    if (loading) return;

    const formData = new FormData();

    formData.append('role', 'PATIENT');

    await submitUserRole(formData);
  };

  useEffect(() => {
    if (data && data.success) {
      toast.success('Role Selected');
      router.push(data.redirect);
    }
  }, [data]);

  // Doctor submit handler
  const onDoctorSubmit = async (data: DoctorFormData) => {
    if (loading) return;

    console.log(data);

    const formData = new FormData();
    formData.append('role', 'DOCTOR');
    formData.append('speciality', data.speciality);
    formData.append('credentialUrl', data.credentialUrl);
    formData.append('description', data.description);
    formData.append('experience', data.experience.toString());

    await submitUserRole(formData);
  };

  if (step === 'choose-role') {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* PATIENT CARD */}
        <Card
          onClick={() => !loading && handlePatientSelection()}
          className='border-emerald-900/20 hover:border-emerald-700/60 cursor-pointer transition-all'>
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
            <Button
              className='w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                'Continue as a Patient'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* DOCTOR CARD */}
        <Card
          onClick={() => !loading && setStep('doctor-role')}
          className='border-emerald-900/20 hover:border-emerald-700/60 cursor-pointer transition-all'>
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
            <Button
              className='w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
              disabled={loading}>
              Continue as a Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'doctor-role') {
    return (
      <Card className='border-emerald-900/20'>
        <CardContent className='pt-6'>
          <div className='mb-6'>
            <CardTitle className='text-2xl font-bold text-white mb-2'>
              Complete Your Doctor Profile
            </CardTitle>
            <CardDescription className='mb-4'>
              {' '}
              Please provide your professional details for verification
            </CardDescription>
          </div>

          <form className='space-y-6' onSubmit={handleSubmit(onDoctorSubmit)}>
            {/* SPECIALITY */}
            <div className='space-y-2'>
              <Label htmlFor='speciality'>Medical Speciality</Label>
              <Select
                value={specialityValue}
                onValueChange={(value) => setValue('speciality', value)}>
                <SelectTrigger id='speciality' className='w-full'>
                  <SelectValue placeholder='Select your speciality' />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((spec) => (
                    <SelectItem key={spec.name} value={spec.name}>
                      <div className='flex items-center gap-2'>
                        <span className='text-emerald-400'>{spec.icon}</span>
                        {spec.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.speciality && (
                <p className='text-sm font-medium text-red-500 mt-1'>
                  {errors.speciality.message}
                </p>
              )}
            </div>

            {/* CREDIANTIAL URL */}
            <div className='space-y-2'>
              <Label htmlFor='credentialUrl'>
                Link to Crediantial Document
              </Label>
              <Input
                id='credentialUrl'
                type='url'
                placeholder='https://example.com/my-medical-degree.pdf'
                {...register('credentialUrl')}
              />
              {errors.credentialUrl && (
                <p className='text-sm font-medium text-red-500 mt-1'>
                  {errors.credentialUrl.message}
                </p>
              )}
              <p className='text-sm text-muted-foreground'>
                Please provide a link to your medical degree or certification
              </p>
            </div>

            {/* EXPERIENCE */}
            <div className='space-y-2'>
              <Label htmlFor='experience'>Years of Experience</Label>
              <Input
                id='experience'
                type='number'
                placeholder='e.g. 5'
                {...register('experience', { valueAsNumber: true })}
              />
              {errors.experience && (
                <p className='text-sm font-medium text-red-500 mt-1'>
                  {errors.experience.message}
                </p>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className='space-y-2'>
              <Label htmlFor='description'>Description of Your Services</Label>
              <Textarea
                id='description'
                placeholder='Describe your expertise, services, and approach to patient care..'
                {...register('description')}
              />
              {errors.description && (
                <p className='text-sm font-medium text-red-500 mt-1'>
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className='pt-2 flex items-center justify-between'>
              <Button
                type='button'
                variant={'outline'}
                onClick={() => setStep('choose-role')}
                className='border-emerald-900/30 cursor-pointer'
                disabled={loading}>
                Back
              </Button>
              <Button
                type='submit'
                className='bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white'
                disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }
};

export default OnboardingPage;
