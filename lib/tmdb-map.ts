import type { Episode, Person, Title } from '@/types';

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

interface RawEpisodeAir {
  air_date: string | null;
  episode_number: number;
  season_number: number;
  name: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  te: 'Telugu',
  ta: 'Tamil',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
  th: 'Thai',
  ar: 'Arabic',
};

const episodeAir = (e?: RawEpisodeAir | null) =>
  e?.air_date
    ? { season: e.season_number, episode: e.episode_number, name: e.name, airDate: e.air_date }
    : undefined;

/** Extra fields on a TMDB movie or tv detail call made with append_to_response. */
export interface TmdbDetail extends TmdbResult {
  images?: {
    logos?: { file_path: string; iso_639_1: string | null; aspect_ratio?: number }[];
    posters?: { file_path: string; iso_639_1: string | null; vote_average: number }[];
  };
  genres?: { id: number; name: string }[];
  original_language?: string;
  next_episode_to_air?: RawEpisodeAir | null;
  last_episode_to_air?: RawEpisodeAir | null;
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  seasons?: { season_number: number; name: string; episode_count: number }[];
  tagline?: string;
  production_companies?: { name: string }[];
  networks?: { name: string }[];
  created_by?: { name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
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
  const logos = raw.images?.logos ?? [];
  const logo =
    logos.find((l) => l.iso_639_1 === 'en') ?? logos.find((l) => l.iso_639_1 === null) ?? logos[0];
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
    releaseDate: raw.release_date ?? raw.first_air_date ?? undefined,
    language: raw.original_language
      ? (LANGUAGE_NAMES[raw.original_language] ?? raw.original_language.toUpperCase())
      : undefined,
    seasonList: (raw.seasons ?? [])
      .filter((x) => x.season_number > 0 && x.episode_count > 0)
      .map((x) => ({ number: x.season_number, name: x.name, episodeCount: x.episode_count })),
    nextEpisode: episodeAir(raw.next_episode_to_air),
    lastEpisode: episodeAir(raw.last_episode_to_air),
    // Poster without baked-in lettering, so the logo never doubles up with the artwork
    heroPath:
      [...(raw.images?.posters ?? [])]
        .filter((x) => x.iso_639_1 === null)
        .sort((a, b) => b.vote_average - a.vote_average)[0]?.file_path ?? null,
    logoPath: logo?.file_path ?? null,
    logoRatio: logo?.aspect_ratio ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 14).map((c) => ({
      id: c.id,
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

/** TMDB person detail with combined credits. */
export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
  biography?: string;
  birthday?: string | null;
  place_of_birth?: string | null;
  known_for_department?: string;
  combined_credits?: { cast: (TmdbResult & { popularity?: number })[] };
}

export function mapPerson(raw: TmdbPerson): { person: Person; known: Title[] } {
  const seen = new Set<string>();
  const known = (raw.combined_credits?.cast ?? [])
    .filter((c) => c.poster_path && (c.media_type === 'movie' || c.media_type === 'tv'))
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .map((c, i) => mapResult(c, i))
    .filter((t): t is Title => {
      if (!t || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .slice(0, 24);
  const born = [formatDate(raw.birthday ?? undefined), raw.place_of_birth]
    .filter(Boolean)
    .join(' · ');
  return {
    person: {
      id: raw.id,
      name: raw.name,
      photoPath: raw.profile_path,
      department: raw.known_for_department ?? '',
      born,
      bio: raw.biography?.trim() ?? '',
      knownFor: known.map((t) => t.id),
    },
    known,
  };
}

/** One TMDB season with its episodes. */
export interface TmdbSeason {
  episodes: {
    episode_number: number;
    name: string;
    overview: string;
    runtime: number | null;
    still_path: string | null;
    air_date: string | null;
  }[];
}

export const mapEpisodes = (raw: TmdbSeason): Episode[] =>
  raw.episodes.map((e) => ({
    number: e.episode_number,
    name: e.name,
    overview: e.overview,
    runtime: e.runtime ?? 0,
    stillPath: e.still_path,
    airDate: e.air_date ?? '',
  }));
