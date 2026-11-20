import { useEffect, useState } from 'react';

import { loadSeason } from '@/lib/api';
import type { Episode } from '@/types';

export function useSeason(id: string, season: number, enabled = true) {
  const [state, setState] = useState<{ episodes: Episode[]; loading: boolean; failed: boolean }>({
    episodes: [],
    loading: enabled,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setState({ episodes: [], loading: true, failed: false });
    loadSeason(id, season)
      .then((episodes) => live && setState({ episodes, loading: false, failed: false }))
      .catch(() => live && setState({ episodes: [], loading: false, failed: true }));
    return () => {
      live = false;
    };
  }, [id, season, enabled, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
