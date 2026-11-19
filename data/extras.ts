import type { Title } from '@/types';

export const episodeNames = [
  'The Crown Fits',
  'Salt and Silk',
  'The Quiet Wing',
  'Two Seats at the Table',
  'What the River Keeps',
  'Ash on the Water',
  'The Long Night',
  'Every Door Opens',
];

export const episodeBlurbs = [
  'A new arrival learns who she can trust.',
  'A banquet turns into a negotiation nobody agreed to.',
  'Letters surface that were never meant to be read.',
  'An old rival returns with an offer.',
  'The group leaves the capital for the first time.',
  'Someone is not who they said they were.',
  'Everyone is awake and nobody is safe.',
  'The last door opens onto the first problem.',
];

export interface Review {
  user: string;
  initials: string;
  when: string;
  score: number;
  likes: number;
  text: string;
}

export const reviews: Review[] = [
  {
    user: 'aria_reads',
    initials: 'AR',
    when: '3 days ago',
    score: 9,
    likes: 214,
    text: 'Slow in the best way. The best sequence alone is worth the runtime, and the ending lands without explaining itself.',
  },
  {
    user: 'dev.k',
    initials: 'DK',
    when: 'Last week',
    score: 8,
    likes: 96,
    text: 'Gorgeous to look at, a little long in the middle. The lead carries every scene he is in.',
  },
  {
    user: 'mira_s',
    initials: 'MS',
    when: '2 weeks ago',
    score: 9,
    likes: 71,
    text: 'Saw it twice. The second time I only watched the sound design.',
  },
];

export const genres = [
  'Action',
  'Adventure',
  'Drama',
  'Horror',
  'Mystery',
  'Sci-Fi',
  'Thriller',
  'History',
];

export const browseTiles = [
  { genre: 'Action', id: 'godzilla' },
  { genre: 'Horror', id: 'silent' },
  { genre: 'Adventure', id: 'odyssey' },
  { genre: 'Drama', id: 'empress' },
];

export const recentSearches = ['wolf', 'horror', 'tom hale'];
export const trendingSearches = ['Godzilla', 'The Odyssey', 'Empress', 'Silent Hill'];

export interface Clip {
  title: string;
  length: string;
}

export const clipsOf = (t: Pick<Title, 'kind' | 'seasons'>): Clip[] =>
  t.kind === 'movie'
    ? [
        { title: 'Official trailer', length: '2:34' },
        { title: 'Teaser', length: '0:48' },
        { title: 'Behind the scenes', length: '4:12' },
      ]
    : [
        { title: `Season ${t.seasons ?? 1} trailer`, length: '1:58' },
        { title: 'Teaser', length: '0:42' },
        { title: 'Cast interview', length: '6:30' },
      ];

/** Short caption lines shown over the simulated trailer. */
export const captions: Record<string, string[]> = {
  odyssey: [
    '“Every road home costs something.”',
    '“I counted the days. Then I stopped.”',
    '“The sea does not owe you a way back.”',
  ],
  godzilla: ['“It is not leaving.”', '“Then we give it a reason to.”'],
  resident: ['“Nobody leaves tonight.”', '“Close the gates.”'],
  empress: ['“A crown is only heavy if you let it be.”', '“Dinner is at eight.”'],
  spider: ['“Not again.”', '“Okay. Okay. I have a plan.”'],
  wolf: ['“Sell me this room.”', '“Close the deal.”'],
  silent: ['“The fog is answering.”', '“Don’t look back.”'],
};

export interface UpdateItem {
  id: string;
  text: string;
  when: string;
  action?: string;
  unread: boolean;
}

export const updates: UpdateItem[] = [
  { id: 'empress', text: 'S1 · E4 is out now.', when: '2m ago', action: 'Watch', unread: true },
  { id: 'wolf', text: 'airs tonight at 9:30 PM.', when: '1h ago', unread: true },
  { id: 'silent', text: 'has a new trailer.', when: '3h ago', action: 'Watch', unread: true },
  { id: 'godzilla', text: 'moved to Dec 12.', when: 'Yesterday', unread: false },
  { id: 'odyssey', text: 'is now on your watchlist.', when: 'Mon', unread: false },
];

export const heroSlides = [
  { id: 'godzilla', eyebrow: 'No. 1 in movies today' },
  { id: 'odyssey', eyebrow: 'Trending this week' },
  { id: 'spider', eyebrow: 'Coming 23 Jan' },
  { id: 'resident', eyebrow: 'New series' },
];

/** Titles that show as story rings on Home */
export const ringIds = ['godzilla', 'odyssey', 'empress', 'wolf', 'silent'];
