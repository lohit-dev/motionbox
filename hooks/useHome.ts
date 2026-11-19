import { useEffect, useState } from 'react';

import { titles as seed } from '@/data/titles';
import { hasTmdb, loadHome } from '@/lib/api';
import type { Title } from '@/types';

interface Home {
  trending: Title[];
  upcoming: Title[];
  series: Title[];
  loading: boolean;
  failed: boolean;
  source: 'tmdb' | 'seed';
}

const SEED: Home = {
  trending: seed,
  upcoming: seed.filter((t) => t.kind === 'movie'),
  series: seed.filter((t) => t.kind === 'series'),
  loading: false,
  failed: false,
  source: 'seed',
};

/** Home feed from TMDB: trending this week, upcoming movies and popular series. */
export function useHome(reloadKey = 0): Home {
  const [state, setState] = useState<Home>(() => (hasTmdb() ? { ...SEED, loading: true } : SEED));

  useEffect(() => {
    if (!hasTmdb()) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    loadHome()
      .then((data) => {
        if (live) setState({ ...data, loading: false, failed: false, source: 'tmdb' });
      })
      .catch(() => {
        if (live) setState({ ...SEED, failed: true });
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  return state;
}
