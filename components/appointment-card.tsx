'use client';

import { generateVideoToken } from '@/actions/appointment';
import {
  addNotesToAppointment,
  cancelAppointment,
  markAppointmentCompleted,
} from '@/actions/doctor';
import useFetch from '@/hooks/use-fetch';
import { Appointment, Prisma, User } from '@/lib/generated/prisma';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  Stethoscope,
  User as UserIcon,
  Video,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { formatDateTime, formatTime } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useRouter } from 'next/navigation';
import { Textarea } from './ui/textarea';

type Action = 'cancel' | 'notes' | 'video' | 'complete';

type AppointmentWithOptionalRelations = Partial<
  Pick<
    Prisma.AppointmentGetPayload<{ include: { doctor: true; patient: true } }>,
    'doctor' | 'patient'
  >
> &
  Omit<
    Prisma.AppointmentGetPayload<{ include: { doctor: true; patient: true } }>,
    'doctor' | 'patient'
  >;

type AppointmentCardProps = {
  appointment: AppointmentWithOptionalRelations;
  userRole: 'DOCTOR' | 'PATIENT';
};

const AppointmentCard = ({ appointment, userRole }: AppointmentCardProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [action, setAction] = useState<Action | null>(null);
  const [notes, setNotes] = useState<string>('');

  const router = useRouter();

  // UseFetch hooks for server actions
  const {
    loading: cancelLoading,
    fn: submitCancel,
    data: cancelData,
  } = useFetch(cancelAppointment);
  const {
    loading: notesLoading,
    fn: submitNotes,
    data: notesData,
  } = useFetch(addNotesToAppointment);
  const {
    loading: tokenLoading,
    fn: submitTokenRequest,
    data: tokenData,
  } = useFetch(generateVideoToken);
  const {
    loading: completeLoading,
    fn: submitMarkCompleted,
    data: completeData,
  } = useFetch(markAppointmentCompleted);

  // Check if appointment can be mark completed
  const canMarkCompleted = () => {
    if (userRole !== 'DOCTOR' || appointment.status !== 'SCHEDULED') {
      return false;
    }

    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);
    return now >= appointmentEndTime;
  };

  // Handle mark completed
  const handleMarkCompleted = async () => {
    if (completeLoading) return;

    // Check if appointment time has passed
    const now = new Date();
    const appointmentEndTime = new Date(appointment.endTime);

    if (now < appointmentEndTime) {
      alert('Cannot mark appointment as completed befor the schedule end time');
      return;
    }

    if (
      window.confirm(
        'Are you sure you want to mark this appointment as completed? This action cannot be undone'
      )
    ) {
      const formData = new FormData();

      formData.append('appointmentId', appointment.id);
      await submitMarkCompleted(formData);
    }
  };

  // Handle video call
  const handleJoinVideoCall = async () => {
    if (tokenLoading) return;

    setAction('video');

    const formData = new FormData();
    formData.append('appointmentId', appointment.id);
    await submitTokenRequest(formData);
  };

  // Determine if appointment is active (within 30 minutes of start time)
  const isAppointmentActive = () => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const appointmentEndTime = new Date(appointment.endTime);

    return (
      (appointmentTime.getTime() - now.getTime() <= 30 * 60 * 1000 &&
        now < appointmentTime) ||
      (now >= appointmentTime && now <= appointmentEndTime)
    );
  };

  // Handle save notes
  const handleSaveNotes = async () => {
    if (notesLoading || userRole !== 'DOCTOR') return;

    const formData = new FormData();

    formData.append('notes', notes);
    formData.append('appointmentId', appointment.id);
    await submitNotes(formData);
  };

  // Handle cancel appointment
  const handleCancelAppointment = async () => {
    if (cancelLoading) return;

    if (
      window.confirm(
        'Are you sure you want to cancel this appointment? This action cannot be undone.'
      )
    ) {
      const formData = new FormData();
      formData.append('appointmentId', appointment.id);

      await submitCancel(formData);
    }
  };

  useEffect(() => {
    if (completeData?.success) {
      toast.success('Appointment marked as completed');
      setOpen(false);
    }
  }, [completeData]);

  useEffect(() => {
    if (tokenData?.success) {
      router.push(
        `/video-call?sessionId=${tokenData.videoSessionId}&token=${tokenData.token}&appointmentId=${appointment.id}`
      );
    }
  }, [tokenData, appointment.id, router]);

  useEffect(() => {
    if (notesData?.success) {
      toast.success('Notes saved successfully');
      setAction(null);
    }
  }, [notesData]);

  useEffect(() => {
    if (cancelData?.success) {
      toast.success('Appointment cancelled successfully');
      setOpen(false);
    }
  }, [cancelData]);

  // Determine the other party information based on user role
  const otherParty =
    userRole === 'DOCTOR' ? appointment.patient : appointment.doctor;
  const otherPartyLabel = userRole === 'DOCTOR' ? 'Patient' : 'Doctor';
  const otherPartyIcon = userRole === 'DOCTOR' ? <UserIcon /> : <Stethoscope />;

  return (
    <>
      <Card className='border-emerald-900/20 hover:border-emerald-700/60 transition-all'>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <div className='bg-muted/20 rounded-full p-2 mt-1'>
                {otherPartyIcon}
              </div>
              <div>
                <h3 className='font-medium text-white'>
                  {userRole === 'DOCTOR'
                    ? otherParty?.name
                    : `Dr. ${otherParty?.name}`}
                </h3>
                <p className='text-sm text-muted-foreground'>
                  {userRole === 'DOCTOR' && otherParty?.email}
                  {userRole === 'PATIENT' && otherParty?.speciality}
                </p>

                <div className='flex items-center mt-2 text-sm text-muted-foreground'>
                  <Calendar className='h-4 w-4 mr-1' />
                  <span>{formatDateTime(appointment.startTime)}</span>
                </div>

                <div className='flex items-center mt-1 text-sm text-muted-foreground'>
                  <Clock className='h-4 w-4 mr-1' />
                  <span>
                    {formatTime(appointment.startTime)} -{' '}
                    {formatTime(appointment.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-2 self-end md:self-start'>
              <Badge
                variant={'outline'}
                className={
                  appointment.status === 'COMPLETED'
                    ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-400'
                    : appointment.status === 'CANCELLED'
                    ? 'bg-red-900/20 border-red-900/30 text-red-400'
                    : 'bg-amber-900/20 border-amber-900/30 text-amber-400'
                }>
                {appointment.status}
              </Badge>
              <div className='flex gap-2 mt-2 flex-wrap'>
                {canMarkCompleted() && (
                  <Button
                    size={'sm'}
                    disabled={completeLoading}
                    onClick={handleMarkCompleted}
                    className='bg-emerald-600 hover:bg-emerald-700 text-slate-100 cursor-pointer'>
                    {completeLoading ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                      </>
                    ) : (
                      <>
                        <CheckCircle className='h-4 w-4 mr-2' />
                        Complete
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant={'outline'}
                  size={'sm'}
                  onClick={() => setOpen(true)}
                  className='!border-emerald-900/30 cursor-pointer'>
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold text-white'>
              Appointment Details
            </DialogTitle>
            <DialogDescription>
              {appointment.status === 'SCHEDULED'
                ? 'Manage your upcoming appointment'
                : 'View appointment information'}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 px-4'>
            {/* Other party information */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                {otherPartyLabel}
              </h4>

              <div className='flex items-center'>
                <div className='h-5 w-5 mr-2 text-emerald-400'>
                  {otherPartyIcon}
                </div>
                <div>
                  <p className='text-white font-medium'>
                    {userRole === 'DOCTOR'
                      ? otherParty?.name
                      : `Dr. ${otherParty?.name}`}
                  </p>
                  {userRole === 'DOCTOR' && (
                    <p className='text-sm text-muted-foreground'>
                      {otherParty?.email}
                    </p>
                  )}
                  {userRole === 'PATIENT' && (
                    <p className='text-sm text-muted-foreground'>
                      {otherParty?.speciality}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Time */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Scheduled Time
              </h4>

              <div className='flex flex-col gap-1'>
                <div className='flex items-center'>
                  <Calendar className='h-5 w-5 text-emerald-400 mr-2' />
                  <p className='text-white'>
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className='flex items-center'>
                  <Clock className='h-5 w-5 text-emerald-400 mr-2' />
                  <p className='text-white'>
                    {formatTime(appointment.startTime)} -{' '}
                    {formatTime(appointment.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment Status */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-muted-foreground'>
                Status
              </h4>
              <Badge
                variant={'outline'}
                className={
                  appointment.status === 'COMPLETED'
                    ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-400'
                    : appointment.status === 'CANCELLED'
                    ? 'bg-red-900/20 border-red-900/30 text-red-400'
                    : 'bg-amber-900/20 border-amber-900/30 text-emerald-400'
                }>
                {appointment.status}
              </Badge>
            </div>

            {/* Patient Description */}
            {appointment.patientDescription && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  {userRole === 'DOCTOR'
                    ? 'Patient Description'
                    : 'Your Description'}
                </h4>

                <div className='p-3 rounded-md bg-muted/20 border border-emerald-900/20'>
                  <p className='text-white whitespace-pre-line'>
                    {appointment.patientDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Join Video Call Button */}
            {appointment.status === 'SCHEDULED' && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Video Consultation
                </h4>
                <p className='text-sm text-muted-foreground'>
                  Video Call will be available 30 minutes before appointment
                </p>
                <Button
                  className='w-full bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-slate-100 '
                  onClick={handleJoinVideoCall}
                  disabled={
                    !isAppointmentActive() || action === 'video' || tokenLoading
                  }>
                  {tokenLoading || action === 'video' ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Preparing video call...
                    </>
                  ) : (
                    <>
                      <Video className='h-4 w4 mr-2' />
                      {isAppointmentActive()
                        ? 'Join Video Call'
                        : 'Video Not Ready '}
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Doctor notes: (Doctor can view/edit, Patient can only view) */}
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium text-muted-foreground'>
                  Doctor Notes
                </h4>
                {userRole === 'DOCTOR' &&
                  action !== 'notes' &&
                  appointment.status !== 'CANCELLED' && (
                    <Button
                      size={'sm'}
                      variant={'ghost'}
                      onClick={() => setAction('notes')}
                      className='h-7 text-emerald-400 hover:text-emerald-300 hover:!bg-emerald-900/30 cursor-pointer'>
                      <Edit className='h-3.5 w-3.5 mr-1' />
                      {appointment.notes ? 'Edit' : 'Add'}
                    </Button>
                  )}
              </div>

              {userRole === 'DOCTOR' && action === 'notes' ? (
                <div className='space-y-3'>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder='Enter your clinical notes here...'
                    className='bg-background border-emerald-900/20 min-h-[100px]'
                  />

                  <div className='flex justify-end space-x-2'>
                    <Button
                      type='button'
                      variant={'outline'}
                      onClick={() => {
                        setAction(null);
                        setNotes(appointment.notes || '');
                      }}
                      className='!border-emerald-900/30 cursor-pointer'
                      disabled={notesLoading}>
                      Cancel
                    </Button>
                    <Button
                      size={'sm'}
                      onClick={handleSaveNotes}
                      className='bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-slate-100'
                      disabled={notesLoading}>
                      {notesLoading ? (
                        <>
                          <Loader2 className='h-3.5 w-3.5 mr-2 animate-spin' />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='p-3 rounded-md bg-muted/20 border border-emerald-900/20 min-h-[80px]'>
                  {appointment.notes ? (
                    <p className='text-white whitespace-pre-line'>
                      {appointment.notes}
                    </p>
                  ) : (
                    <p className='text-muted-foreground italic'>
                      No notes added yet
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className='flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2'>
            <div className='flex gap-2'>
              {canMarkCompleted() && (
                <Button className='bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-slate-100'>
                  {completeLoading ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                      Completing
                    </>
                  ) : (
                    <>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}

              {appointment.status === 'SCHEDULED' && (
                <Button
                  variant={'outline'}
                  disabled={cancelLoading}
                  onClick={handleCancelAppointment}
                  className='!border-red-900/30 text-red-400 hover:!bg-red-900/30 hover:text-red-500 mt-3 sm:mt-0 cursor-pointer'>
                  {cancelLoading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className='h-4 w-4 mr-2' />
                      Cancel Appointment
                    </>
                  )}
                </Button>
              )}
            </div>
            <Button
              onClick={() => setOpen(false)}
              className='bg-emerald-600 hover:bg-emerald-700 text-slate-100 cursor-pointer'>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCard;
