export type TitleKind = 'movie' | 'series';

export type TitleId = string;

export interface CastMember {
  /** TMDB person id */
  id?: number;
  name: string;
  role: string;
  /** TMDB profile image path */
  photoPath?: string | null;
}

export interface EpisodeAir {
  season: number;
  episode: number;
  name: string;
  /** ISO date */
  airDate: string;
}

export interface Episode {
  number: number;
  name: string;
  overview: string;
  /** Minutes, 0 when unknown */
  runtime: number;
  stillPath: string | null;
  airDate: string;
}

export interface Season {
  number: number;
  name: string;
  episodeCount: number;
}

export interface Person {
  id: number;
  name: string;
  photoPath: string | null;
  department: string;
  born: string;
  bio: string;
  knownFor: TitleId[];
}

export interface Clip {
  title: string;
  /** Duration such as "2:34", or the kind of video when TMDB does not give one */
  length: string;
  /** YouTube video key for clips that come from TMDB */
  key?: string;
}

export interface Review {
  user: string;
  initials: string;
  when: string;
  /** Null when the reviewer gave no rating */
  score: number | null;
  likes: number;
  text: string;
}

export interface Title {
  id: TitleId;
  name: string;
  kind: TitleKind;
  year: number;
  /** TMDB vote average, 0-10 */
  score: number;
  runtime: string;
  rating: string;
  genres: string[];
  seasons?: number;
  released: string;
  director: string;
  studio: string;
  /** Lower is more popular. Drives the Top 10 order. */
  popularity: number;
  story: string;
  cast: CastMember[];
  related: TitleId[];
  posterPath: string | null;
  backdropPath: string | null;
  /** TMDB localized title logo, when available */
  logoPath?: string | null;
  /** Width over height of the logo, so it can be sized before the image has loaded */
  logoRatio?: number | null;
  /** Textless poster, preferred behind a title logo */
  heroPath?: string | null;
  /** ISO release or first air date, used for upcoming and new-release updates */
  releaseDate?: string;
  /** Original language name, for example "English" */
  language?: string;
  seasonList?: Season[];
  nextEpisode?: EpisodeAir;
  lastEpisode?: EpisodeAir;
  /** Set once the full TMDB detail has been loaded */
  detailed?: boolean;
  tagline?: string;
  clips?: Clip[];
  reviews?: Review[];
}

export interface AiringEntry {
  id: TitleId;
  /** Short line under the name, for example "New episode" */
  episode: string;
  /** "Airs today", "Airs Friday" */
  time: string;
}

export type Weekday = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export type LibraryTab = 'saved' | 'watching' | 'watched';

export type Sort = 'popular' | 'top' | 'new';

export type AiringSegment = 'all' | 'mine';

export interface Filters {
  kind: TitleKind | 'all';
  genres: string[];
  /** 0-10 in steps of 0.5 */
  minScore: number;
  sort: Sort;
}

export const NO_FILTERS: Filters = { kind: 'all', genres: [], minScore: 0, sort: 'popular' };
