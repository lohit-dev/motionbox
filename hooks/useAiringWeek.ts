import { useEffect, useState } from 'react';

import { airing } from '@/data/airing';
import { hasTmdb, loadAiringWeek } from '@/lib/api';
import type { AiringEntry } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Airing schedule per weekday (Sunday first). TMDB gives the day, so entries have no clock time. */
export function useAiringWeek(week: { index: number; date: number }[]) {
  const [schedule, setSchedule] = useState<AiringEntry[][]>(airing);
  const [loading, setLoading] = useState(hasTmdb());

  useEffect(() => {
    if (!hasTmdb()) return;
    let live = true;
    const today = new Date();
    const days = week.map((d) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + d.index);
      return date;
    });
    loadAiringWeek(days)
      .then((perDay) => {
        if (!live) return;
        const todayIndex = today.getDay();
        setSchedule(
          perDay.map((day, i) =>
            day.map((t) => ({
              id: t.id,
              episode: 'New episode',
              time: i === todayIndex ? 'Airs today' : `Airs ${DAYS[i]}`,
            }))
          )
        );
        setLoading(false);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [week]);

  return { schedule, loading };
}
