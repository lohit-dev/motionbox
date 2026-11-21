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
/** Slides in the hero carousel */
const HERO = 4;
const HERO_WAIT = 2500;

const wait = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
const upgrade = (list: Title[], full: (Title | null)[]) =>
  list.map((t) => full.find((detail) => detail?.id === t.id) ?? t);

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
        });
        // Slow connection: the details still land, the hero just upgrades when they do
        if (!early) {
          details.then((full) => {
            if (live) setState((s) => ({ ...s, trending: upgrade(s.trending, full) }));
          });
        }
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
