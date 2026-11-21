import type { Weekday } from '@/types';

const weekdays: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface WeekDay {
  /** 0 = Sunday, matches Date#getDay() and the airing schedule index */
  index: number;
  weekday: Weekday;
  date: number;
  isToday: boolean;
}

/** The Sunday-to-Saturday week that contains `today`. */
export function currentWeek(today = new Date()): WeekDay[] {
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  return weekdays.map((weekday, index) => {
    const d = new Date(start);
    d.setDate(start.getDate() + index);
    return { index, weekday, date: d.getDate(), isToday: index === today.getDay() };
  });
}
