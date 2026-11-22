import { useEffect, useState } from 'react';

import { hasTmdb, loadAiringWeek } from '@/lib/api';
import type { AiringEntry } from '@/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Airing schedule per weekday (Sunday first). TMDB gives the day, not a clock time. */
export function useAiringWeek(reloadKey = 0) {
  const [result, setResult] = useState<{
    key: number;
    schedule: AiringEntry[][];
    failed: boolean;
  } | null>(null);
  const configured = hasTmdb();

  useEffect(() => {
    if (!configured) return;
    let live = true;
    const today = new Date();
    const days = DAYS.map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      return date;
    });
    loadAiringWeek(days)
      .then((perDay) => {
        if (!live) return;
        setResult({
          key: reloadKey,
          schedule: perDay.map((day, i) =>
            day.map((t) => ({
              id: t.id,
              episode: 'New episode',
              time: i === today.getDay() ? 'Airs today' : `Airs ${DAYS[i]}`,
            }))
          ),
          failed: false,
        });
      })
      .catch(() => {
        if (!live) return;
        setResult({ key: reloadKey, schedule: [[], [], [], [], [], [], []], failed: true });
      });
    return () => {
      live = false;
    };
  }, [reloadKey, configured]);

  const current = result?.key === reloadKey ? result : null;
  return {
    schedule: current?.schedule ?? [[], [], [], [], [], [], []],
    loading: configured && !current,
    failed: current?.failed ?? false,
  };
}
