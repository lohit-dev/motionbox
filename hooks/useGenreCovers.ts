import { useEffect, useState } from 'react';

import { hasTmdb, loadGenreCovers } from '@/lib/api';

/** Backdrop path per genre name. Empty until loaded, so tiles can show a quiet placeholder. */
export function useGenreCovers() {
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (!hasTmdb()) return;
    let live = true;
    loadGenreCovers()
      .then((c) => live && setCovers(c))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return covers;
}
