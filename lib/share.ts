import { Share } from 'react-native';

import type { Person, Title } from '@/types';

export type ShareRequest = { kind: 'title'; title: Title } | { kind: 'person'; person: Person };

let host: ((request: ShareRequest) => void) | null = null;

/** The ShareCardHost registers itself here, so any screen can share without owning a card. */
export const registerShareHost = (fn: ((request: ShareRequest) => void) | null) => {
  host = fn;
};

const plain = (message: string) => Share.share({ message });

/** Shares a title as a card image. Falls back to plain text if the card can't be drawn. */
export function shareTitle(title: Title) {
  if (host) host({ kind: 'title', title });
  else plain(`${title.name} on Motion Box`);
}

/** Shares a person as a card image. */
export function sharePerson(person: Person) {
  if (host) host({ kind: 'person', person });
  else plain(`${person.name} on Motion Box`);
}

export const shareFallback = (request: ShareRequest) =>
  plain(`${request.kind === 'title' ? request.title.name : request.person.name} on Motion Box`);
