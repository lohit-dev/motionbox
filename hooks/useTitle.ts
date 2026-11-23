import { useEffect, useState } from 'react';

import { hasTmdb, loadDetail, parseId } from '@/lib/api';
import { getTitle } from '@/lib/titles';
import type { Title } from '@/types';

/**
 * A title by id. Returns what is already known straight away (a list card), then upgrades it
 * with the full TMDB detail once that arrives.
 */
export function useTitle(id: string) {
  const [result, setResult] = useState<{ key: string; failed: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${attempt}`;
  const title = getTitle(id);
  const shouldLoad = hasTmdb() && !!parseId(id) && !title?.detailed;

  useEffect(() => {
    if (!shouldLoad) return;

    let live = true;
    loadDetail(id)
      .then(() => live && setResult({ key, failed: false }))
      .catch(() => {
        if (!live) return;
        setResult({ key, failed: true });
      });
    return () => {
      live = false;
    };
  }, [id, key, shouldLoad]);

  const current = result?.key === key ? result : null;
  return {
    title,
    loading: shouldLoad && !current,
    failed: shouldLoad && (current?.failed ?? false),
    retry: () => setAttempt((n) => n + 1),
  };
}

/**
 * Several titles by id, in order. Missing ones are fetched, so a library restored from disk
 * fills in again after a restart.
 */
export function useTitles(ids: string[]) {
  const key = ids.join(',');
  const [, setTick] = useState(0);
  const [completedKey, setCompletedKey] = useState<string | null>(null);
  const requestIds = key ? key.split(',') : [];
  const missing = requestIds.filter(
    (id) => parseId(id) && !getTitle(id)?.detailed && !getTitle(id)
  );

  useEffect(() => {
    if (!hasTmdb()) return;
    const missingIds = (key ? key.split(',') : []).filter(
      (id) => parseId(id) && !getTitle(id)?.detailed && !getTitle(id)
    );
    if (!missingIds.length) return;
    let live = true;
    Promise.all(missingIds.map((id) => loadDetail(id).catch(() => null))).then(() => {
      if (!live) return;
      setCompletedKey(key);
      setTick((n) => n + 1);
    });
    return () => {
      live = false;
    };
  }, [key]);

  const titles = requestIds.map((id) => getTitle(id)).filter((t): t is Title => !!t);
  return { titles, loading: hasTmdb() && missing.length > 0 && completedKey !== key };
}
