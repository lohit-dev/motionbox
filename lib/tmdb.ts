const API = 'https://api.themoviedb.org/3';
const IMAGES = 'https://image.tmdb.org/t/p';

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original';

/** Builds a TMDB image url from a poster or backdrop path. Returns null when there is no path. */
export const imageUrl = (path: string | null | undefined, size: PosterSize = 'w500') =>
  path ? `${IMAGES}/${size}${path}` : null;

type Params = Record<string, string | number | boolean | undefined>;

let language = 'en-US';

/** Content language sent with every request. Change it and clear the api cache to apply. */
export const setTmdbLanguage = (code: string) => {
  language = code;
};

/**
 * Thin TMDB v3 client. Put a read access token in EXPO_PUBLIC_TMDB_TOKEN (see .env.example).
 * No region parameter is ever sent.
 */
export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const token = process.env.EXPO_PUBLIC_TMDB_TOKEN;
  if (!token) throw new Error('Missing EXPO_PUBLIC_TMDB_TOKEN');

  // TMDB v3 keys are 32 characters and belong in the query string; v4 read tokens use Bearer auth.
  const isV3Key = /^[a-f0-9]{32}$/i.test(token);
  const withLanguage = { language, ...params };
  const queryParams = isV3Key ? { ...withLanguage, api_key: token } : withLanguage;
  const query = Object.entries(queryParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  const response = await fetch(`${API}${path}${query ? `?${query}` : ''}`, {
    headers: {
      ...(isV3Key ? {} : { Authorization: `Bearer ${token}` }),
      accept: 'application/json',
    },
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
  nowPlaying: '/movie/now_playing',
  topRated: '/movie/top_rated',
  discoverMovies: '/discover/movie',
  airingToday: '/tv/airing_today',
  search: '/search/multi',
  movie: (id: number | string) => `/movie/${id}`,
  series: (id: number | string) => `/tv/${id}`,
  videos: (kind: 'movie' | 'tv', id: number | string) => `/${kind}/${id}/videos`,
  person: (id: number | string) => `/person/${id}`,
  season: (id: number | string, season: number) => `/tv/${id}/season/${season}`,
} as const;
