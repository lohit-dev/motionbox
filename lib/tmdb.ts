const API = 'https://api.themoviedb.org/3';
const IMAGES = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original';

/** Builds a TMDB image url from a poster or backdrop path. Returns null when there is no path. */
export const imageUrl = (path: string | null | undefined, size: PosterSize = 'w500') =>
  path ? `${IMAGES}/${size}${path}` : null;

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Thin TMDB v3 client. Put a read access token in EXPO_PUBLIC_TMDB_TOKEN (see .env.example).
 * No region parameter is ever sent.
 */
export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  if (!token) throw new Error('Missing EXPO_PUBLIC_TMDB_TOKEN');

  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  const response = await fetch(`${API}${path}${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`TMDB ${response.status}`);
  return (await response.json()) as T;
}

export const endpoints = {
  trendingWeek: '/trending/all/week',
  popularMovies: '/movie/popular',
  popularSeries: '/tv/popular',
  upcomingMovies: '/movie/upcoming',
  airingToday: '/tv/airing_today',
  search: '/search/multi',
  movie: (id: number | string) => `/movie/${id}`,
  series: (id: number | string) => `/tv/${id}`,
  videos: (kind: 'movie' | 'tv', id: number | string) => `/${kind}/${id}/videos`,
} as const;
