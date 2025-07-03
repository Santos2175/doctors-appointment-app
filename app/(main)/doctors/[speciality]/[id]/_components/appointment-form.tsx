'use client';

import { bookAppointment, TimeSlot } from '@/actions/appointment';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useFetch from '@/hooks/use-fetch';
import { format } from 'date-fns';
import { Calendar, Clock, CreditCard, Loader2 } from 'lucide-react';
import React, { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  doctorId: string;
  slot: TimeSlot;
  onBack: () => void;
  onComplete: () => void;
};

const AppointmentForm = ({ doctorId, slot, onBack, onComplete }: Props) => {
  const [description, setDescription] = useState<string>('');

  // Use Fetch hook to handle loading, data and error states
  const { loading, data, fn: submitBooking } = useFetch(bookAppointment);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Create form data
    const formData = new FormData();
    formData.append('doctorId', doctorId);
    formData.append('startTime', slot.startTime);
    formData.append('endTime', slot.endTime);
    formData.append('description', description);

    await submitBooking(formData);
  };

  useEffect(() => {
    if (data && data.success) {
      toast.success('Appointment booked successfully');
      onComplete();
    }
  }, [data]);

  return (
    <form className='space-y-6' onSubmit={handleSubmit}>
      <div className='bg-muted/20 p-4 rounded-lg border border-emerald-900/30 space-y-3'>
        <div className='flex items-center'>
          <Calendar className='h-5 w-5 text-emerald-400 mr-2' />
          <span className='text-white font-medium'>
            {format(new Date(slot.startTime), 'EEEE, MMMM d, yyyy')}
          </span>
        </div>
        <div className='flex items-center'>
          <Clock className='h-5 w-5 text-emerald-400 mr-2' />
          <span className='text-white'>{slot.formatted}</span>
        </div>
        <div className='flex items-center'>
          <CreditCard className='h-5 w-5 text-emerald-400 mr-2' />
          <span className='text-muted-foreground'>
            Cost: <span className='text-white font-medium'>2 Credits</span>
          </span>
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>
          Describe your medical concern(optional)
        </Label>
        <Textarea
          id='description'
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide any details about your medical concern or what you'd like to discuss in the appointment..."
          className='bg-background border-emerald-900/20 h-32'
        />
        <p className='text-sm text-muted-foreground'>
          This information will be shared with the doctor before your
          appointment.
        </p>
      </div>
      {/* Buttons */}
      <div className='flex justify-between pt-2'>
        <Button
          type='button'
          variant={'outline'}
          onClick={onBack}
          className='!border-emerald-900/30 cursor-pointer'>
          Change Time Slot
        </Button>
        <Button
          type='submit'
          disabled={loading}
          className='bg-emerald-600 hover:bg-emerald-700 text-slate-100 cursor-pointer '>
          {loading ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Loading...
            </>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
