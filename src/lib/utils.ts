import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date/time to Vietnam timezone (Asia/Ho_Chi_Minh, UTC+7)
 */
export function formatToVietnamTime(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return '-';
  
  // Default options for Vietnam timezone
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    ...options,
  };
  
  return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(dateObj);
}

/**
 * Format date to Vietnam date string (dd/mm/yyyy)
 */
export function formatVietnamDate(
  date: Date | string | null | undefined
): string {
  return formatToVietnamTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date and time to Vietnam datetime string (dd/mm/yyyy, HH:mm)
 */
export function formatVietnamDateTime(
  date: Date | string | null | undefined
): string {
  return formatToVietnamTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format time to Vietnam time string (HH:mm)
 */
export function formatVietnamTime(
  date: Date | string | null | undefined
): string {
  return formatToVietnamTime(date, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format full datetime to Vietnam string (dd/mm/yyyy, HH:mm:ss)
 */
export function formatVietnamDateTimeFull(
  date: Date | string | null | undefined
): string {
  return formatToVietnamTime(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}