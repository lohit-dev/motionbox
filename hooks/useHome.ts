import { useEffect, useState } from 'react';

import { titles as seed } from '@/data/titles';
import { hasTmdb, loadDetail, loadHome } from '@/lib/api';
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
        if (!live) return;
        setState({ ...data, loading: false, failed: false, source: 'tmdb' });
        void Promise.all(data.trending.slice(0, 4).map((title) => loadDetail(title.id).catch(() => null)))
          .then((details) => {
            if (!live) return;
            setState((current) => ({
              ...current,
              trending: current.trending.map(
                (title) => details.find((detail) => detail?.id === title.id) ?? title
              ),
            }));
          });
      })
      .catch(() => {
        if (live) {
          setState({
            trending: [],
            upcoming: [],
            series: [],
            loading: false,
            failed: true,
            source: 'tmdb',
          });
        }
      });
    return () => {
      live = false;
    };
  }, [reloadKey]);

  return state;
}
