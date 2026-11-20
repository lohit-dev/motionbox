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
  const [state, setState] = useState<State>(IDLE);
  const page = useRef(1);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([query.trim(), filters, attempt]);

  useEffect(() => {
    if (!hasTmdb() || !enabled) {
      setState(IDLE);
      return;
    }
    const controller = new AbortController();
    page.current = 1;
    busy.current = false;
    setState({ ...IDLE, loading: true });
    const timer = setTimeout(() => {
      searchPage(query, filters, 1, controller.signal)
        .then((res) => setState({ ...IDLE, ...res, loading: false }))
        .catch((error: unknown) => {
          if ((error as Error).name === 'AbortError') return;
          setState({ ...IDLE, failed: true });
        });
    }, 320);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  const loadMore = useCallback(() => {
    if (busy.current || !state.hasMore || state.loading) return;
    busy.current = true;
    page.current += 1;
    setState((s) => ({ ...s, loadingMore: true }));
    searchPage(query, filters, page.current)
      .then((res) =>
        setState((s) => {
          const seen = new Set(s.titles.map((t) => t.id));
          return {
            ...s,
            titles: s.titles.concat(res.titles.filter((t) => !seen.has(t.id))),
            people: s.people.concat(res.people),
            hasMore: res.hasMore,
            loadingMore: false,
          };
        })
      )
      .catch(() => setState((s) => ({ ...s, loadingMore: false, hasMore: false })))
      .finally(() => {
        busy.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.hasMore, state.loading, key]);

  return { ...state, loadMore, retry: () => setAttempt((n) => n + 1) };
}
