import { useEffect, useState } from 'react';

import { loadSeason } from '@/lib/api';
import type { Episode } from '@/types';

export function useSeason(id: string, season: number, enabled = true) {
  const [state, setState] = useState<{
    key: string;
    episodes: Episode[];
    failed: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${season}:${attempt}`;

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadSeason(id, season)
      .then((episodes) => live && setState({ key, episodes, failed: false }))
      .catch(() => live && setState({ key, episodes: [], failed: true }));
    return () => {
      live = false;
    };
  }, [id, season, enabled, key]);

  const current = state?.key === key ? state : null;
  return {
    episodes: current?.episodes ?? [],
    loading: enabled && !current,
    failed: current?.failed ?? false,
    retry: () => setAttempt((n) => n + 1),
  };
}
