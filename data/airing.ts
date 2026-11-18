import type { AiringEntry, Weekday } from '@/types';

export const weekdays: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Schedule per weekday, Sunday first. */
export const airing: AiringEntry[][] = [
  [
    { id: 'empress', episode: 'S1 · E4 · The Quiet Wing', time: 'Now' },
    { id: 'silent', episode: 'S1 · E2 · Fog Line', time: '8:00 PM' },
    { id: 'wolf', episode: 'S3 · E7 · The Turn', time: '9:30 PM' },
    { id: 'resident', episode: 'S1 · E5 · Quarantine', time: '10:00 PM' },
  ],
  [
    { id: 'wolf', episode: 'S3 · E8 · The Offer', time: '9:00 PM' },
    { id: 'empress', episode: 'S1 · E5 · Ash on the Water', time: '10:00 PM' },
  ],
  [
    { id: 'silent', episode: 'S1 · E3 · Static', time: '8:30 PM' },
    { id: 'resident', episode: 'S1 · E6 · Lockdown', time: '10:00 PM' },
    { id: 'wolf', episode: 'S3 · E9 · Cold Open', time: '11:00 PM' },
  ],
  [{ id: 'empress', episode: 'S1 · E6 · The Long Night', time: '9:00 PM' }],
  [
    { id: 'wolf', episode: 'S3 · E10 · Close', time: '9:30 PM' },
    { id: 'silent', episode: 'S1 · E4 · Hollow', time: '10:30 PM' },
  ],
  [
    { id: 'resident', episode: 'S1 · E7 · The Gate', time: '8:00 PM' },
    { id: 'empress', episode: 'S1 · E7 · Every Door Opens', time: '9:00 PM' },
    { id: 'silent', episode: 'S1 · E5 · Below', time: '10:00 PM' },
  ],
  [
    { id: 'wolf', episode: 'S3 · E11 · Finale', time: '9:00 PM' },
    { id: 'empress', episode: 'S1 · E8 · The Last Supper', time: '10:00 PM' },
  ],
];
