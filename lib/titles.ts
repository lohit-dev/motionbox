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

/** The loaded title that has this YouTube clip, so the player can show what is playing. */
export const findByClip = (key: string): Title | undefined =>
  Object.values(byId).find((t) => t.clips?.some((c) => c.key === key));
