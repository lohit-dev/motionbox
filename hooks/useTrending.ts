import { useEffect, useState } from 'react';

import { registerTitles, titles as seed } from '@/data/titles';
import { endpoints, tmdb } from '@/lib/tmdb';
import { mapResult, type TmdbResult } from '@/lib/tmdb-map';
import type { Title } from '@/types';

interface State {
  titles: Title[];
  loading: boolean;
  /** True when the request failed and the seed titles are being shown */
  failed: boolean;
  source: 'tmdb' | 'seed';
}

/**
 * Trending titles. With EXPO_PUBLIC_TMDB_TOKEN set it loads this week's trending from TMDB,
 * otherwise it returns the bundled seed titles so the app always has something to show.
 */
export function useTrending(reloadKey = 0): State {
  const [state, setState] = useState<State>({
    titles: seed,
    loading: !!process.env.EXPO_PUBLIC_TMDB_TOKEN,
    failed: false,
    source: 'seed',
  });

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_TMDB_TOKEN) return;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, failed: false }));

    tmdb<{ results: TmdbResult[] }>(endpoints.trendingWeek, {}, controller.signal)
      .then(({ results }) => {
        const mapped = results.map((r, i) => mapResult(r, i)).filter((t): t is Title => !!t);
        registerTitles(mapped);
        setState({ titles: mapped, loading: false, failed: false, source: 'tmdb' });
      })
      .catch((error: unknown) => {
        if ((error as Error).name === 'AbortError') return;
        setState({ titles: seed, loading: false, failed: true, source: 'seed' });
      });

    return () => controller.abort();
  }, [reloadKey]);

  return state;
}
