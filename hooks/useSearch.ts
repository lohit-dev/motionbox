import { useCallback, useEffect, useRef, useState } from 'react';

import { hasTmdb, searchPage, type SearchPage } from '@/lib/api';
import type { Filters, Title } from '@/types';

interface State {
  titles: Title[];
  people: SearchPage['people'];
  total: number;
  hasMore: boolean;
  loading: boolean;
  loadingMore: boolean;
  failed: boolean;
}

const IDLE: State = {
  titles: [],
  people: [],
  total: 0,
  hasMore: false,
  loading: false,
  loadingMore: false,
  failed: false,
};

/**
 * Live TMDB results for a query and filters, loaded a page at a time.
 * Call loadMore() from the list's onEndReached for infinite scrolling.
 */
export function useSearch(query: string, filters: Filters, enabled: boolean) {
  const [result, setResult] = useState<{ key: string; state: State } | null>(null);
  const page = useRef(1);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([query.trim(), filters, attempt]);
  const active = hasTmdb() && enabled;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    page.current = 1;
    busy.current = false;
    const timer = setTimeout(() => {
      searchPage(query, filters, 1, controller.signal)
        .then((res) => setResult({ key, state: { ...IDLE, ...res, loading: false } }))
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === 'AbortError') return;
          setResult({ key, state: { ...IDLE, failed: true } });
        });
    }, 320);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [active, filters, key, query]);

  const loadMore = useCallback(() => {
    const current = result?.key === key ? result.state : IDLE;
    if (busy.current || !active || result?.key !== key || !current.hasMore || current.loading)
      return;
    busy.current = true;
    page.current += 1;
    setResult((previous) =>
      previous?.key === key ? { key, state: { ...previous.state, loadingMore: true } } : previous
    );
    searchPage(query, filters, page.current)
      .then((res) =>
        setResult((previous) => {
          if (previous?.key !== key) return previous;
          const seen = new Set(previous.state.titles.map((t) => t.id));
          return {
            key,
            state: {
              ...previous.state,
              titles: previous.state.titles.concat(res.titles.filter((t) => !seen.has(t.id))),
              people: previous.state.people.concat(res.people),
              hasMore: res.hasMore,
              loadingMore: false,
            },
          };
        })
      )
      .catch(() =>
        setResult((previous) =>
          previous?.key === key
            ? {
                key,
                state: { ...previous.state, loadingMore: false, hasMore: false },
              }
            : previous
        )
      )
      .finally(() => {
        busy.current = false;
      });
  }, [active, filters, key, query, result]);

  const state = active && result?.key === key ? result.state : IDLE;
  return {
    ...state,
    loading: active && (result?.key !== key || state.loading),
    loadMore,
    retry: () => setAttempt((n) => n + 1),
  };
}
