import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to safely get string from FormData
export const getString = (value: FormDataEntryValue | null): string => {
  return typeof value === 'string' ? value : '';
};

// Format date and time
export const formatDateTime = (dateString: Date) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a");
  } catch (e) {
    return 'Invalid date';
  }
};

// Format time only
export const formatTime = (dateString: Date) => {
  try {
    return format(new Date(dateString), 'h:mm a');
  } catch (e) {
    return 'Invalid time';
  }
};
