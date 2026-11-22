import { useEffect, useState } from 'react';

import { hasTmdb, loadDetail, loadHome } from '@/lib/api';
import type { Title } from '@/types';

interface Home {
  trending: Title[];
  upcoming: Title[];
  fresh: Title[];
  series: Title[];
  loading: boolean;
  failed: boolean;
  /** False when no TMDB key is configured */
  configured: boolean;
}

interface HomeSnapshot extends Home {
  requestKey: number;
}

const EMPTY = { trending: [], upcoming: [], fresh: [], series: [] };
/** Slides in the hero carousel */
const HERO = 4;
const HERO_WAIT = 2500;

const wait = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
const upgrade = (list: Title[], full: (Title | null)[]) =>
  list.map((t) => full.find((detail) => detail?.id === t.id) ?? t);

/** Home feed: trending this week, upcoming and in-cinema movies, and popular series. */
export function useHome(reloadKey = 0): Home {
  const configured = hasTmdb();
  const [state, setState] = useState<HomeSnapshot>({
    ...EMPTY,
    loading: configured,
    failed: false,
    configured,
    requestKey: reloadKey,
  });

  useEffect(() => {
    if (!configured) return;
    let live = true;
    loadHome(reloadKey > 0)
      .then(async (data) => {
        // The hero needs title logos and textless art, which only come with the full detail.
        // Wait for them, briefly, so Home appears finished instead of changing under the eye.
        const details = Promise.all(
          data.trending.slice(0, HERO).map((t) => loadDetail(t.id).catch(() => null))
        );
        const early = await Promise.race([details, wait(HERO_WAIT)]);
        if (!live) return;
        setState({
          ...data,
          trending: upgrade(data.trending, early ?? []),
          loading: false,
          failed: false,
          configured,
          requestKey: reloadKey,
        });
        // Slow connection: the details still land, the hero just upgrades when they do
        if (!early) {
          details.then((full) => {
            if (live)
              setState((s) =>
                s.requestKey === reloadKey ? { ...s, trending: upgrade(s.trending, full) } : s
              );
          });
        }
      })
      .catch(() => {
        if (live)
          setState({
            ...EMPTY,
            loading: false,
            failed: true,
            configured,
            requestKey: reloadKey,
          });
      });
    return () => {
      live = false;
    };
  }, [reloadKey, configured]);

  const current = state.requestKey === reloadKey;
  return {
    ...state,
    loading: configured && (!current || state.loading),
    failed: current && state.failed,
  };
}
