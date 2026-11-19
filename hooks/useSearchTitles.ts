import { useEffect, useState } from 'react';

import { discoverGenre, hasTmdb, searchTitles } from '@/lib/api';
import type { Title } from '@/types';

/**
 * Live TMDB results for a text query, or for a genre when there is no text.
 * `results` is null while there is nothing to show remotely, so callers can fall back to seed data.
 */
export function useSearchTitles(query: string, genre: string | null) {
  const text = query.trim();
  const [results, setResults] = useState<Title[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasTmdb() || (text.length < 2 && !genre)) {
      setResults(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      const request =
        text.length >= 2
          ? searchTitles(text, controller.signal)
          : discoverGenre(genre!, controller.signal);
      request
        .then((found) => {
          setResults(found);
          setLoading(false);
        })
        .catch((error: unknown) => {
          if ((error as Error).name === 'AbortError') return;
          setResults(null);
          setLoading(false);
        });
    }, 320);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, genre]);

  return { results, loading };
}
