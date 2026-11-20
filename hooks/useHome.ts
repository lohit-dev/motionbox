import { useEffect, useState } from 'react';

import { hasTmdb, loadDetail, loadHome } from '@/lib/api';
import type { Title } from '@/types';

interface Home {
  trending: Title[];
  upcoming: Title[];
  series: Title[];
  loading: boolean;
  failed: boolean;
  /** False when no TMDB key is configured */
  configured: boolean;
}

const EMPTY = { trending: [], upcoming: [], series: [] };

/** Home feed: trending this week, upcoming movies and popular series. */
export function useHome(reloadKey = 0): Home {
  const configured = hasTmdb();
  const [state, setState] = useState<Home>({
    ...EMPTY,
    loading: configured,
    failed: false,
    configured,
  });

  useEffect(() => {
    if (!configured) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    loadHome(reloadKey > 0)
      .then((data) => {
        if (!live) return;
        setState({ ...data, loading: false, failed: false, configured });
        // The hero shows title logos, which only come with the full detail
        Promise.all(data.trending.slice(0, 5).map((t) => loadDetail(t.id).catch(() => null))).then(
          (full) => {
            if (!live) return;
            setState((current) => ({
              ...current,
              trending: current.trending.map(
                (t) => full.find((detail) => detail?.id === t.id) ?? t
              ),
            }));
          }
        );
      })
      .catch(() => {
        if (live) setState({ ...EMPTY, loading: false, failed: true, configured });
      });
    return () => {
      live = false;
    };
  }, [reloadKey, configured]);

  return state;
}
