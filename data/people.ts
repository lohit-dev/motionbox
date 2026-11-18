import type { Person } from '@/types';

export const people: Person[] = [
  {
    name: 'Tom Hale',
    initials: 'TH',
    line: 'Actor · London · b. 1984',
    bio: 'Stage-trained and screen-famous for roles that carry more than they say. Known for long, physical leads and a quiet intensity that holds a close-up.',
  },
  {
    name: 'Mira Voss',
    initials: 'MV',
    line: 'Actor · Berlin · b. 1991',
    bio: 'A precise, watchful performer who built her career on supporting parts that quietly steal the film.',
  },
  {
    name: 'Idris Kane',
    initials: 'IK',
    line: 'Actor · Lagos · b. 1979',
    bio: 'Veteran of stage and television with a voice people remember long after the credits.',
  },
  {
    name: 'Lena Ortiz',
    initials: 'LO',
    line: 'Actor · Madrid · b. 1988',
    bio: 'Equally at home in period drama and genre films, known for rapid, unshowy intelligence on screen.',
  },
  {
    name: 'Ravi Menon',
    initials: 'RM',
    line: 'Actor · Kochi · b. 1982',
    bio: 'Character actor with two decades of work across thrillers, dramas and the occasional comedy.',
  },
  {
    name: 'Jun Park',
    initials: 'JP',
    line: 'Actor · Seoul · b. 1993',
    bio: 'Breakout lead known for restless, physical performances and an eye for the small moment.',
  },
  {
    name: 'Sofia Bell',
    initials: 'SB',
    line: 'Actor · Toronto · b. 1990',
    bio: 'Screen and voice actor; her work in fog-heavy horror made her a genre favourite.',
  },
  {
    name: 'Marcus Reid',
    initials: 'MR',
    line: 'Actor · Chicago · b. 1976',
    bio: 'Dependable lead of mid-budget thrillers, recently moving into producing.',
  },
];

export const getPerson = (name: string): Person | undefined => people.find((p) => p.name === name);
