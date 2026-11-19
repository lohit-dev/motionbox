import type { Title } from '@/types';

const GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  9648: 'Mystery',
  878: 'Sci-Fi',
  53: 'Thriller',
  10765: 'Sci-Fi',
  10759: 'Action',
};

/** Subset of the TMDB v3 movie or tv result that the app uses. */
export interface TmdbResult {
  id: number;
  media_type?: 'movie' | 'tv' | 'person';
  title?: string;
  name?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso?: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : '';
}

/** Maps a TMDB result to the app's Title. Fields TMDB only returns on detail calls stay empty. */
export function mapResult(
  r: TmdbResult,
  index: number,
  fallbackKind: 'movie' | 'tv' = 'movie'
): Title | null {
  const kind = (r.media_type ?? fallbackKind) === 'tv' ? 'series' : 'movie';
  if (r.media_type === 'person') return null;
  const date = r.release_date ?? r.first_air_date;
  return {
    id: `${kind === 'series' ? 'tv' : 'movie'}-${r.id}`,
    name: r.title ?? r.name ?? 'Untitled',
    kind,
    year: date ? Number(date.slice(0, 4)) : new Date().getFullYear(),
    score: Math.round((r.vote_average ?? 0) * 10) / 10,
    runtime: '',
    rating: '',
    genres: [...new Set((r.genre_ids ?? []).map((g) => GENRES[g]).filter(Boolean))],
    released: formatDate(date),
    director: '',
    studio: '',
    popularity: index + 1,
    story: r.overview ?? '',
    cast: [],
    related: [],
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
  };
}
