import { useEffect, useState } from 'react';

import { hasTmdb, loadAiringWeek } from '@/lib/api';
import type { AiringEntry } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Airing schedule per weekday (Sunday first). TMDB gives the day, not a clock time. */
export function useAiringWeek(reloadKey = 0) {
  const [schedule, setSchedule] = useState<AiringEntry[][]>([[], [], [], [], [], [], []]);
  const [loading, setLoading] = useState(hasTmdb());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasTmdb()) return;
    let live = true;
    setLoading(true);
    setFailed(false);
    const today = new Date();
    const days = DAYS.map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      return date;
    });
    loadAiringWeek(days)
      .then((perDay) => {
        if (!live) return;
        setSchedule(
          perDay.map((day, i) =>
            day.map((t) => ({
              id: t.id,
              episode: 'New episode',
              time: i === today.getDay() ? 'Airs today' : `Airs ${DAYS[i]}`,
            }))
          )
        );
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setLoading(false);
        setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  return { schedule, loading, failed };
}
