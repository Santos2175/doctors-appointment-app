import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to safely get string from FormData
export const getString = (value: FormDataEntryValue | null): string => {
  return typeof value === 'string' ? value : '';
};
