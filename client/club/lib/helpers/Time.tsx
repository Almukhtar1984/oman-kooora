import { parse, formatDistanceToNow, isValid } from 'date-fns';
import { ar } from 'date-fns/locale';

export function getTimeAgo(createdAt: string): string {
  try {
    // Adjust the format string to match your date format
    const createdDate = parse(createdAt, 'dd/MM/yyyy HH:mm:ss', new Date());
    if (!isValid(createdDate)) throw new Error('Invalid date');
    return formatDistanceToNow(createdDate, { addSuffix: true, locale: ar });
  } catch (error) {
    console.error('Error parsing date:', error);
    return 'تاريخ غير صالح';
  }
}