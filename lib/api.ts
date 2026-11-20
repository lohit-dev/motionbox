import { endpoints, tmdb } from '@/lib/tmdb';
import {
  mapDetail,
  mapEpisodes,
  mapPerson,
  mapResult,
  type TmdbDetail,
  type TmdbPerson,
  type TmdbResult,
  type TmdbSeason,
} from '@/lib/tmdb-map';
import { registerTitles } from '@/lib/titles';
import type { Episode, Filters, Person, Title } from '@/types';

/** True when a TMDB key or token is configured. */
export const hasTmdb = () => !!process.env.EXPO_PUBLIC_TMDB_TOKEN;

/** "movie-603" -> { kind: "movie", n: 603 } */
export function parseId(id: string) {
  const m = /^(movie|tv)-(\d+)$/.exec(id);
  return m ? { kind: m[1] as 'movie' | 'tv', n: Number(m[2]) } : null;
}

type Page<T> = { results: T[]; page: number; total_pages: number; total_results: number };

const details = new Map<string, Promise<Title>>();
const seasons = new Map<string, Promise<Episode[]>>();
const people = new Map<number, Promise<{ person: Person; known: Title[] }>>();
let home: ReturnType<typeof fetchHome> | null = null;

/** Forget everything cached, for example after the content language changes. */
export function clearApiCache() {
  details.clear();
  seasons.clear();
  people.clear();
  home = null;
  covers = null;
}

const list = (results: TmdbResult[], kind: 'movie' | 'tv') => {
  const mapped = results
    .map((r, i) => mapResult(r, i, kind))
    .filter((t): t is Title => !!t && !!t.posterPath);
  registerTitles(mapped);
  return mapped;
};

/** Full detail for one title: cast, trailers, reviews, logo, certification and similar titles. */
export function loadDetail(id: string): Promise<Title> {
  const parsed = parseId(id);
  if (!parsed) return Promise.reject(new Error('Not a TMDB id'));
  let hit = details.get(id);
  if (!hit) {
    hit = tmdb<TmdbDetail>(`/${parsed.kind}/${parsed.n}`, {
      append_to_response: 'credits,videos,reviews,similar,release_dates,content_ratings,images',
      include_image_language: 'en,null',
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

/** Episodes of one season. */
export function loadSeason(id: string, season: number): Promise<Episode[]> {
  const parsed = parseId(id);
  if (!parsed) return Promise.reject(new Error('Not a series'));
  const key = `${id}:${season}`;
  let hit = seasons.get(key);
  if (!hit) {
    hit = tmdb<TmdbSeason>(endpoints.season(parsed.n, season))
      .then(mapEpisodes)
      .catch((error: unknown) => {
        seasons.delete(key);
        throw error;
      });
    seasons.set(key, hit);
  }
  return hit;
}

export function loadPerson(id: number) {
  let hit = people.get(id);
  if (!hit) {
    hit = tmdb<TmdbPerson>(endpoints.person(id), { append_to_response: 'combined_credits' })
      .then((raw) => {
        const result = mapPerson(raw);
        registerTitles(result.known);
        return result;
      })
      .catch((error: unknown) => {
        people.delete(id);
        throw error;
      });
    people.set(id, hit);
  }
  return hit;
}

async function fetchHome() {
  const [trending, upcoming, series] = await Promise.all([
    tmdb<Page<TmdbResult>>(endpoints.trendingWeek),
    tmdb<Page<TmdbResult>>(endpoints.upcomingMovies),
    tmdb<Page<TmdbResult>>(endpoints.popularSeries),
  ]);
  return {
    trending: list(trending.results, 'movie'),
    upcoming: list(upcoming.results, 'movie'),
    series: list(series.results, 'tv'),
  };
}

/** Trending, upcoming and popular series. One shared request, so Home and Search never double up. */
export function loadHome(force = false) {
  if (force || !home) {
    const request = fetchHome();
    home = request;
    request.catch(() => {
      if (home === request) home = null;
    });
  }
  return home;
}

export interface SearchPage {
  titles: Title[];
  people: { id: number; name: string; photoPath: string | null; department: string }[];
  total: number;
  hasMore: boolean;
}

const GENRE_IDS: Record<string, { movie: number | null; tv: number | null }> = {
  Action: { movie: 28, tv: 10759 },
  Adventure: { movie: 12, tv: 10759 },
  Animation: { movie: 16, tv: 16 },
  Comedy: { movie: 35, tv: 35 },
  Crime: { movie: 80, tv: 80 },
  Drama: { movie: 18, tv: 18 },
  Family: { movie: 10751, tv: 10751 },
  Fantasy: { movie: 14, tv: 10765 },
  History: { movie: 36, tv: null },
  Horror: { movie: 27, tv: null },
  Mystery: { movie: 9648, tv: 9648 },
  Romance: { movie: 10749, tv: null },
  'Sci-Fi': { movie: 878, tv: 10765 },
  Thriller: { movie: 53, tv: null },
};

/** Genres offered in the filter sheet. */
export const GENRES = Object.keys(GENRE_IDS);

const SORT_MOVIE = {
  popular: 'popularity.desc',
  top: 'vote_average.desc',
  new: 'primary_release_date.desc',
} as const;
const SORT_TV = {
  popular: 'popularity.desc',
  top: 'vote_average.desc',
  new: 'first_air_date.desc',
} as const;

const applySort = (items: Title[], sort: Filters['sort']) => {
  if (sort === 'top') return [...items].sort((a, b) => b.score - a.score);
  if (sort === 'new') return [...items].sort((a, b) => b.year - a.year);
  return items;
};

const passes = (t: Title, f: Filters) =>
  (f.kind === 'all' || t.kind === f.kind) &&
  t.score >= f.minScore &&
  (!f.genres.length || f.genres.some((g) => t.genres.includes(g)));

/** One page of results: text search when there is a query, otherwise a filtered discover. */
export async function searchPage(
  query: string,
  filters: Filters,
  page: number,
  signal?: AbortSignal
): Promise<SearchPage> {
  if (query.trim().length >= 2) {
    const res = await tmdb<
      Page<TmdbResult & { known_for_department?: string; profile_path?: string | null }>
    >(endpoints.search, { query: query.trim(), include_adult: false, page }, signal);
    const media = res.results.filter((r) => r.media_type !== 'person');
    const titles = applySort(
      list(media, 'movie').filter((t) => passes(t, filters)),
      filters.sort
    );
    const found = res.results
      .filter((r) => r.media_type === 'person')
      .map((r) => ({
        id: r.id,
        name: r.name ?? '',
        photoPath: r.profile_path ?? null,
        department: r.known_for_department ?? '',
      }));
    return { titles, people: found, total: res.total_results, hasMore: page < res.total_pages };
  }

  const wantMovies = filters.kind !== 'series';
  const wantTv = filters.kind !== 'movie';
  const ids = (key: 'movie' | 'tv') =>
    [
      ...new Set(filters.genres.map((g) => GENRE_IDS[g]?.[key]).filter((n): n is number => !!n)),
    ].join('|');
  const common = (key: 'movie' | 'tv') => ({
    page,
    include_adult: false,
    with_genres: ids(key) || undefined,
    'vote_average.gte': filters.minScore || undefined,
    'vote_count.gte': filters.sort === 'top' ? 300 : 20,
  });
  const [movies, shows] = await Promise.all([
    wantMovies && !(filters.genres.length && !ids('movie'))
      ? tmdb<Page<TmdbResult>>(
          '/discover/movie',
          { ...common('movie'), sort_by: SORT_MOVIE[filters.sort] },
          signal
        )
      : null,
    wantTv && !(filters.genres.length && !ids('tv'))
      ? tmdb<Page<TmdbResult>>(
          '/discover/tv',
          { ...common('tv'), sort_by: SORT_TV[filters.sort] },
          signal
        )
      : null,
  ]);
  const titles = applySort(
    list(movies?.results ?? [], 'movie').concat(list(shows?.results ?? [], 'tv')),
    filters.sort
  );
  return {
    titles,
    people: [],
    total: (movies?.total_results ?? 0) + (shows?.total_results ?? 0),
    hasMore: (!!movies && page < movies.total_pages) || (!!shows && page < shows.total_pages),
  };
}

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Series airing on each given day. TMDB has no air times, only the day. */
export async function loadAiringWeek(days: Date[]) {
  const perDay = await Promise.all(
    days.map((d) =>
      tmdb<Page<TmdbResult>>('/discover/tv', {
        'air_date.gte': isoDay(d),
        'air_date.lte': isoDay(d),
        sort_by: 'popularity.desc',
        with_original_language: 'en',
      })
    )
  );
  return perDay.map((r) => list(r.results.slice(0, 10), 'tv'));
}

let covers: Promise<Record<string, string | null>> | null = null;

/**
 * One landscape backdrop per genre for the Browse tiles. Each genre takes its most popular
 * title whose artwork no other genre has claimed, so no two tiles look the same.
 */
export function loadGenreCovers() {
  if (!covers) {
    const request = (async () => {
      const names = Object.keys(GENRE_IDS);
      const pages = await Promise.all(
        names.map((genre) => {
          const ids = GENRE_IDS[genre];
          const kind = ids.movie ? 'movie' : 'tv';
          return tmdb<Page<{ backdrop_path: string | null }>>(`/discover/${kind}`, {
            with_genres: String(ids[kind] ?? ''),
            sort_by: 'popularity.desc',
            'vote_count.gte': '300',
          }).catch(() => null);
        })
      );
      const used = new Set<string>();
      const out: Record<string, string | null> = {};
      names.forEach((genre, i) => {
        const pick = pages[i]?.results.find((r) => r.backdrop_path && !used.has(r.backdrop_path));
        out[genre] = pick?.backdrop_path ?? null;
        if (pick?.backdrop_path) used.add(pick.backdrop_path);
      });
      return out;
    })();
    covers = request;
    request.catch(() => {
      if (covers === request) covers = null;
    });
  }
  return covers;
}
