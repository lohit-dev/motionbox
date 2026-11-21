import type { Title } from '@/types';

const byId: Record<string, Title> = {};

/** Makes titles loaded from TMDB reachable through getTitle(). A full detail is never replaced by a list card. */
export const registerTitles = (list: Title[]) => {
  for (const t of list) {
    const known = byId[t.id];
    if (known?.detailed && !t.detailed) continue;
    byId[t.id] = t;
  }
};

export const getTitle = (id: string): Title | undefined => byId[id];
