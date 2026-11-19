import { useEffect, useState } from 'react';

import { getTitle } from '@/data/titles';
import { hasTmdb, loadDetail, parseId } from '@/lib/api';
import type { Title } from '@/types';

/**
 * A title by id. Returns what is already known straight away (a list card or the seed data),
 * then upgrades it with the full TMDB detail once that arrives.
 */
export function useTitle(id: string) {
  const [title, setTitle] = useState<Title | undefined>(() => getTitle(id));
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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
  }, [id]);

  return { title, loading, failed };
}
