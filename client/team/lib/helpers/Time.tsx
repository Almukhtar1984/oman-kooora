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

export function isWithinTimeWindow(dateStr: string): boolean {
  try {
    // Parse the date string assuming it's in UTC+4 (Oman time)
    const targetDate = new Date(dateStr.replace(" ", "T") + "+00:00");

    // Get current UTC time and manually adjust to Oman time
    const now = new Date();
    const nowInOman = new Date(now.getTime() + 4 * 60 * 60 * 1000); // UTC + 4h

    const diffMs = targetDate.getTime() - nowInOman.getTime();
    const diffMinutes = diffMs / (1000 * 60);
 

    return diffMinutes > 15 && diffMinutes < 180;
  } catch (error) {
    console.error('Error in isWithinTimeWindow:', error);
    return false;
  }
}
