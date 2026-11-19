import { registerTitles } from '@/data/titles';
import { endpoints, tmdb } from '@/lib/tmdb';
import { mapDetail, mapResult, type TmdbDetail, type TmdbResult } from '@/lib/tmdb-map';
import type { Title } from '@/types';

/** True when a TMDB token is configured. Without one the app runs on bundled seed data. */
export const hasTmdb = () => !!process.env.EXPO_PUBLIC_TMDB_TOKEN;

/** "movie-603" -> { kind: "movie", n: 603 }. Seed titles such as "godzilla" return null. */
export function parseId(id: string) {
  const m = /^(movie|tv)-(\d+)$/.exec(id);
  return m ? { kind: m[1] as 'movie' | 'tv', n: Number(m[2]) } : null;
}

const details = new Map<string, Promise<Title>>();

/** Full detail for one title: cast, trailers, reviews, certification and similar titles. */
export function loadDetail(id: string): Promise<Title> {
  const parsed = parseId(id);
  if (!parsed) return Promise.reject(new Error('Not a TMDB id'));
  let hit = details.get(id);
  if (!hit) {
    hit = tmdb<TmdbDetail>(`/${parsed.kind}/${parsed.n}`, {
      append_to_response: 'credits,videos,reviews,similar,release_dates,content_ratings',
    })
      .then((raw) => {
        const { title, similar } = mapDetail(raw, parsed.kind);
        registerTitles([...similar, title]);
        return title;
      })
      .catch((error: unknown) => {
        details.delete(id);
        throw error;
      });
    details.set(id, hit);
  }
  return hit;
}

const list = (results: TmdbResult[], kind: 'movie' | 'tv') => {
  const mapped = results
    .map((r, i) => mapResult(r, i, kind))
    .filter((t): t is Title => !!t && !!t.posterPath);
  registerTitles(mapped);
  return mapped;
};

export async function loadHome() {
  const [trending, upcoming, series] = await Promise.all([
    tmdb<{ results: TmdbResult[] }>(endpoints.trendingWeek),
    tmdb<{ results: TmdbResult[] }>(endpoints.upcomingMovies),
    tmdb<{ results: TmdbResult[] }>(endpoints.popularSeries),
  ]);
  return {
    trending: list(trending.results, 'movie'),
    upcoming: list(upcoming.results, 'movie'),
    series: list(series.results, 'tv'),
  };
}

export async function searchTitles(query: string, signal?: AbortSignal) {
  const { results } = await tmdb<{ results: TmdbResult[] }>(
    endpoints.search,
    { query, include_adult: false },
    signal
  );
  return list(
    results.filter((r) => r.media_type !== 'person'),
    'movie'
  );
}

/** TMDB genre ids per app genre, [movie, tv]. */
const GENRE_IDS: Record<string, [number, number | null]> = {
  Action: [28, 10759],
  Adventure: [12, 10759],
  Drama: [18, 18],
  Horror: [27, null],
  Mystery: [9648, 9648],
  'Sci-Fi': [878, 10765],
  Thriller: [53, null],
  History: [36, null],
};

export async function discoverGenre(genre: string, signal?: AbortSignal) {
  const ids = GENRE_IDS[genre];
  if (!ids) return [];
  const [movies, shows] = await Promise.all([
    tmdb<{ results: TmdbResult[] }>(
      '/discover/movie',
      { with_genres: ids[0], sort_by: 'popularity.desc', include_adult: false },
      signal
    ),
    ids[1]
      ? tmdb<{ results: TmdbResult[] }>(
          '/discover/tv',
          { with_genres: ids[1], sort_by: 'popularity.desc' },
          signal
        )
      : Promise.resolve({ results: [] as TmdbResult[] }),
  ]);
  return list(movies.results, 'movie')
    .concat(list(shows.results, 'tv'))
    .sort((a, b) => a.popularity - b.popularity);
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Series airing on each given day. TMDB has no air times, so only the day is known. */
export async function loadAiringWeek(days: Date[]) {
  const perDay = await Promise.all(
    days.map((d) =>
      tmdb<{ results: TmdbResult[] }>('/discover/tv', {
        'air_date.gte': isoDay(d),
        'air_date.lte': isoDay(d),
        sort_by: 'popularity.desc',
        with_original_language: 'en',
      })
    )
  );
  return perDay.map((r) => list(r.results.slice(0, 8), 'tv'));
}
