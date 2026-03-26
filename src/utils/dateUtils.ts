import { format, startOfWeek, addDays, parseISO, isValid } from 'date-fns';

export function getWeekStart(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfWeek(d, { weekStartsOn: 1 }); // Monday
}

export function getWeekDates(weekStartDate: string): string[] {
  const start = parseISO(weekStartDate);
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd')
  );
}

export function formatDisplay(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d');
  } catch { return dateStr; }
}

export function formatFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMMM d, yyyy');
  } catch { return dateStr; }
}

export function getDayName(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEE');
  } catch { return ''; }
}

export function getDayNameFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE');
  } catch { return ''; }
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function weekRangeLabel(weekStart: string): string {
  try {
    const start = parseISO(weekStart);
    const end = addDays(start, 6);
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  } catch { return weekStart; }
}

export function prevWeek(weekStart: string): string {
  return format(addDays(parseISO(weekStart), -7), 'yyyy-MM-dd');
}

export function nextWeek(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 7), 'yyyy-MM-dd');
}

export function isValidDate(s: string): boolean {
  return isValid(parseISO(s));
}

export function addDaysStr(dateStr: string, n: number): string {
  return format(addDays(parseISO(dateStr), n), 'yyyy-MM-dd');
}
