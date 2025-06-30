'use client';

import { updateDoctorActiveStatus } from '@/actions/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import useFetch from '@/hooks/use-fetch';
import { User } from '@/lib/generated/prisma';
import { Ban, Check, Loader2, Search, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

type VerifiedDoctorsProps = {
  doctors: User[];
};

const VerifiedDoctors = ({ doctors }: VerifiedDoctorsProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetDoctor, setTargetDoctor] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'SUSPEND' | 'REINSTATE' | null>(
    null
  );

  const {
    loading,
    data,
    fn: submitStatusUpdate,
  } = useFetch(updateDoctorActiveStatus);

  // Filter doctors by query
  const filteredDoctors = doctors.filter((doctor) => {
    const query = searchTerm.toLowerCase();

    return (
      doctor.name?.toLowerCase().includes(query) ||
      doctor.email.toLowerCase().includes(query) ||
      doctor.speciality?.toLowerCase().includes(query)
    );
  });

  // Handle status change i.e. either suspend or reinstate doctor
  const handleStatusChange = async (doctor: User, suspend: boolean) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${suspend ? 'suspend' : 'reinstate'} ${
        doctor.name
      }`
    );

    if (!confirmed || loading) return;

    const formData = new FormData();
    formData.append('doctorId', doctor.id);
    formData.append('suspend', suspend ? 'true' : 'false');

    setTargetDoctor(doctor);
    setActionType(suspend ? 'SUSPEND' : 'REINSTATE');

    await submitStatusUpdate(formData);
  };

  useEffect(() => {
    if (data?.success && actionType && targetDoctor) {
      const actionVerb = actionType === 'SUSPEND' ? 'Suspended' : 'Reinstated';
      toast.success(`${actionVerb} ${targetDoctor.name} successfully!`);
      setTargetDoctor(null);
      setActionType(null);
    }
  }, [data]);
  return (
    <div>
      <Card className='bg-muted/20 border-emerald-900/20'>
        <CardHeader>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div>
              <CardTitle className='text-xl font-bold text-white'>
                Manage Doctors
              </CardTitle>
              <CardDescription>
                View and manage all verified doctors
              </CardDescription>
            </div>

            <div className='relative w-full md:w-64'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search doctors...'
                className='pl-8 bg-background border-emerald-900/20'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredDoctors.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              {searchTerm
                ? 'No doctors match your search criteria'
                : 'No verified doctors available'}
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredDoctors.map((doctor) => {
                const isSuspended = doctor.verificationStatus === 'REJECTED';

                return (
                  <Card
                    key={doctor.id}
                    className='bg-background border-emerald-900/20 hover:bg-emerald-700/30 transition-all'>
                    <CardContent className='p-4'>
                      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='flex items-center gap-3'>
                          <div className='bg-muted/20 rounded-full p-2'>
                            <UserIcon className='h-5 w-5 text-emerald-400' />
                          </div>
                          <div>
                            <h3 className='font-medium text-white'>
                              {doctor.name}
                            </h3>
                            <p className='text-sm text-muted-foreground'>
                              {doctor.speciality} • {doctor.experience} years
                            </p>
                            <p className='text-sm text-muted-foreground mt-1'>
                              {doctor.email}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 self-end md:self-auto'>
                          {isSuspended ? (
                            <>
                              <Badge
                                variant={'outline'}
                                className='bg-red-900/20 border-red-900/30 text-red-400'>
                                Suspended
                              </Badge>
                              <Button
                                variant={'outline'}
                                size={'sm'}
                                disabled={loading}
                                onClick={() =>
                                  handleStatusChange(doctor, false)
                                }
                                className='border-emerald-900/30 hover:bg-muted/80 cursor-pointer'>
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                                ) : (
                                  <Check className='h-4 w-4 mr-1' />
                                )}
                                Reinstate
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge
                                variant={'outline'}
                                className='bg-emerald-900/20 border-emerald-900/30 text-emerald-400'>
                                Active
                              </Badge>

                              <Button
                                variant={'outline'}
                                size={'sm'}
                                disabled={loading}
                                onClick={() => handleStatusChange(doctor, true)}
                                className='border-red-900/30 hover:bg-red-900/30 text-red-400 cursor-pointer'>
                                {loading && targetDoctor?.id === doctor.id ? (
                                  <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                                ) : (
                                  <Ban className='h-4 w-4 mr-1' />
                                )}
                                Suspend
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifiedDoctors;
