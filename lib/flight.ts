import { router } from 'expo-router';
import { Platform } from 'react-native';

import type { Title } from '@/types';

/** Height of the detail hero. The shared poster lands on exactly this box. */
export const heroHeightFor = (screenWidth: number) => Math.min(640, screenWidth * 1.64);

let lastOpen = 0;

/**
 * Opens a title. Pass the card's shared transition tag and the poster flies into the detail
 * hero (Reanimated shared element transition, run natively by the stack). Without a tag the
 * page simply fades in.
 */
export function openTitle(title: Pick<Title, 'id'>, tag?: string) {
  // A second tap while the first page is still opening would stack two details
  const now = Date.now();
  if (now - lastOpen < 600) return;
  lastOpen = now;
  router.push({ pathname: '/title/[id]', params: tag && Platform.OS === 'ios' ? { id: title.id, tag } : { id: title.id } });
}

/** Closes the detail. The stack plays the shared transition backwards on its own. */
export function closeTitle() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// Stable references, so using them never re-renders a screen
export const useOpenTitle = () => openTitle;
