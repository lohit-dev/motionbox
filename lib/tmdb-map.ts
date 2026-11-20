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

/** Extra fields on a TMDB movie or tv detail call made with append_to_response. */
export interface TmdbDetail extends TmdbResult {
  images?: {
    logos?: { file_path: string; iso_639_1: string | null }[];
  };
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  tagline?: string;
  production_companies?: { name: string }[];
  networks?: { name: string }[];
  created_by?: { name: string }[];
  credits?: {
    cast: { name: string; character: string; profile_path: string | null }[];
    crew: { name: string; job: string }[];
  };
  videos?: {
    results: { key: string; name: string; site: string; type: string; official?: boolean }[];
  };
  reviews?: {
    results: {
      author: string;
      content: string;
      created_at: string;
      author_details?: { rating?: number | null };
    }[];
  };
  similar?: { results: TmdbResult[] };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
}

const GENRE_NAMES: Record<string, string> = {
  'Science Fiction': 'Sci-Fi',
  'Sci-Fi & Fantasy': 'Sci-Fi',
  'Action & Adventure': 'Action',
  'War & Politics': 'History',
};

const hoursMinutes = (minutes?: number) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
};

const ago = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 730) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

const VIDEO_ORDER = ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'];

/** Maps a full TMDB detail response to a Title, plus the similar titles for "More like this". */
export function mapDetail(
  raw: TmdbDetail,
  kind: 'movie' | 'tv'
): { title: Title; similar: Title[] } {
  const base = mapResult(raw, 0, kind)!;
  const similar = (raw.similar?.results ?? [])
    .slice(0, 12)
    .map((r, i) => mapResult(r, i, kind))
    .filter((t): t is Title => !!t);

  const certification =
    kind === 'movie'
      ? raw.release_dates?.results
          .find((r) => r.iso_3166_1 === 'US')
          ?.release_dates.find((d) => d.certification)?.certification
      : raw.content_ratings?.results.find((r) => r.iso_3166_1 === 'US')?.rating;

  const clips = (raw.videos?.results ?? [])
    .filter((v) => v.site === 'YouTube')
    .sort((a, b) => {
      const rank = (v: typeof a) =>
        (VIDEO_ORDER.indexOf(v.type) === -1 ? 99 : VIDEO_ORDER.indexOf(v.type)) * 2 +
        (v.official ? 0 : 1);
      return rank(a) - rank(b);
    })
    .slice(0, 8)
    .map((v) => ({ title: v.name, length: v.type, key: v.key }));

  const reviews = (raw.reviews?.results ?? []).slice(0, 8).map((r) => ({
    user: r.author,
    initials: r.author.slice(0, 2).toUpperCase(),
    when: ago(r.created_at),
    score: r.author_details?.rating ?? null,
    likes: 0,
    text: r.content.replace(/\s+/g, ' ').trim().slice(0, 320),
  }));

  const title: Title = {
    ...base,
    genres: [...new Set((raw.genres ?? []).map((g) => GENRE_NAMES[g.name] ?? g.name))],
    runtime: hoursMinutes(kind === 'movie' ? raw.runtime : raw.episode_run_time?.[0]),
    rating: certification ?? '',
    seasons: kind === 'tv' ? raw.number_of_seasons : undefined,
    director:
      kind === 'movie'
        ? (raw.credits?.crew.find((c) => c.job === 'Director')?.name ?? '')
        : (raw.created_by?.[0]?.name ?? ''),
    studio: raw.production_companies?.[0]?.name ?? raw.networks?.[0]?.name ?? '',
    tagline: raw.tagline || undefined,
    logoPath:
      raw.images?.logos?.find((logo) => logo.iso_639_1 === 'en')?.file_path ??
      raw.images?.logos?.find((logo) => logo.iso_639_1 === null)?.file_path ??
      null,
    cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({
      name: c.name,
      role: c.character || 'Cast',
      photoPath: c.profile_path,
    })),
    related: similar.map((t) => t.id),
    clips,
    reviews,
    detailed: true,
  };
  return { title, similar };
}
