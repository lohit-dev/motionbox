import { useEffect, useState } from 'react';

import { hasTmdb, loadDetail, parseId } from '@/lib/api';
import { getTitle } from '@/lib/titles';
import type { Title } from '@/types';

/**
 * A title by id. Returns what is already known straight away (a list card), then upgrades it
 * with the full TMDB detail once that arrives.
 */
export function useTitle(id: string) {
  const [title, setTitle] = useState<Title | undefined>(() => getTitle(id));
  const [loading, setLoading] = useState(() => !getTitle(id) && hasTmdb() && !!parseId(id));
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const known = getTitle(id);
    setTitle(known);
    setFailed(false);
    if (!hasTmdb() || !parseId(id) || known?.detailed) return;

    let live = true;
    setLoading(true);
    loadDetail(id)
      .then((full) => {
        if (!live) return;
        setTitle(full);
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
  }, [id, attempt]);

  return { title, loading, failed, retry: () => setAttempt((n) => n + 1) };
}

/**
 * Several titles by id, in order. Missing ones are fetched, so a library restored from disk
 * fills in again after a restart.
 */
export function useTitles(ids: string[]) {
  const key = ids.join(',');
  const [, setTick] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasTmdb()) return;
    const missing = ids.filter((id) => parseId(id) && !getTitle(id)?.detailed && !getTitle(id));
    if (!missing.length) return;
    let live = true;
    setLoading(true);
    Promise.all(missing.map((id) => loadDetail(id).catch(() => null))).then(() => {
      if (!live) return;
      setLoading(false);
      setTick((n) => n + 1);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const titles = ids.map((id) => getTitle(id)).filter((t): t is Title => !!t);
  return { titles, loading };
}
