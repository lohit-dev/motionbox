import type { Title } from '@/types';

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** 125 -> "2:05", 3725 -> "1:02:05" */
export function clock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** "2:34" -> 154 */
export const parseClock = (value: string) =>
  value.split(':').reduce((total, part) => total * 60 + Number(part), 0);

/** "Movie · 2026" */
/** TMDB reports 0 for titles nobody has rated yet: show no score instead of 0.0 */
export const hasScore = (t: { score: number }) => t.score > 0;

export const kindLine = (t: Pick<Title, 'kind' | 'year'>) =>
  `${t.kind === 'movie' ? 'Movie' : 'Series'} · ${t.year}`;

/** "Adventure · Drama" */
export const genreLine = (t: Pick<Title, 'genres'>, count = 2) =>
  t.genres.slice(0, count).join(' · ');

/** "58% watched" */
export const watchedLabel = (percent: number) => `${Math.round(clamp(percent, 0, 100))}% watched`;

/** Minutes left for a title that is `percent` watched, e.g. "67m left". */
export const timeLeft = (totalMinutes: number, percent: number) =>
  `${Math.max(0, Math.round(totalMinutes * (1 - clamp(percent, 0, 100) / 100)))}m left`;

/** "2h 48m" -> 168 */
export function runtimeMinutes(runtime: string) {
  const h = /(\d+)\s*h/.exec(runtime);
  const m = /(\d+)\s*m/.exec(runtime);
  return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
}

/** Cuts text at a word boundary and adds an ellipsis. */
export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(' ', max);
  return `${text.slice(0, cut > 0 ? cut : max)}…`;
}

/** Initials for avatars: "Tom Hale" -> "TH" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
