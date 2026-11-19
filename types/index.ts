export type TitleKind = 'movie' | 'series';

export type TitleId = string;

export interface CastMember {
  name: string;
  role: string;
  /** TMDB profile image path */
  photoPath?: string | null;
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
  /** Set once the full TMDB detail has been loaded */
  detailed?: boolean;
  tagline?: string;
  clips?: Clip[];
  reviews?: Review[];
}

export interface Person {
  name: string;
  initials: string;
  line: string;
  bio: string;
}

export interface AiringEntry {
  id: TitleId;
  episode: string;
  /** "Now" or a clock time such as "9:00 PM" */
  time: string;
}

export type Weekday = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export type LibraryTab = 'saved' | 'watching' | 'watched';

export type AiringSegment = 'all' | 'mine';
