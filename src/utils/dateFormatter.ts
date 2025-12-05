import { FirebaseTimestamp } from '@/types';

/**
 * Format Firebase timestamp to readable date string
 */
export const formatFirebaseDate = (
  timestamp?: FirebaseTimestamp | string,
  locale: string = 'en-GB'
): string => {
  if (!timestamp) {
    return 'Unknown date';
  }

  if (typeof timestamp === 'string') {
    return new Date(timestamp).toLocaleDateString(locale);
  }

  return new Date(timestamp.seconds * 1000).toLocaleDateString(locale);
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date to locale string
 */
export const formatToLocaleString = (date: Date, locale: string = 'ja-JP'): string => {
  return date.toLocaleDateString(locale);
};
