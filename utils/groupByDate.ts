import { format, isToday, isYesterday, parseISO } from 'date-fns';

export type DateGroupedSection<T> = {
  title: string;
  data: T[];
};

function sectionTitle(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d, yyyy');
}

export function groupItemsByDate<T>(
  items: T[],
  getTimestamp: (item: T) => string | null | undefined,
): DateGroupedSection<T>[] {
  const map = new Map<string, { title: string; data: T[] }>();

  for (const item of items) {
    const raw = getTimestamp(item);
    if (!raw) continue;
    const date = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
    if (Number.isNaN(date.getTime())) continue;
    const key = format(date, 'yyyy-MM-dd');
    const existing = map.get(key);
    if (existing) {
      existing.data.push(item);
    } else {
      map.set(key, { title: sectionTitle(date), data: [item] });
    }
  }

  return Array.from(map.values());
}
