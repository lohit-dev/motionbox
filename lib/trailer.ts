import { router } from 'expo-router';
import { Linking } from 'react-native';

import { loadDetail } from '@/lib/api';
import type { Title } from '@/types';

export const youtubeUrl = (key: string) => `https://www.youtube.com/watch?v=${key}`;

/** Opens the YouTube app or site. Used when a clip can't be played inside Motion Box. */
export const openOnYouTube = (key: string) => Linking.openURL(youtubeUrl(key));

/** Plays a clip in the in-app player. */
export const openClip = (key: string) =>
  router.push({ pathname: '/player/[key]', params: { key } });

/** Plays a title's best trailer, loading its detail first when needed. Returns false when there is none. */
export async function openTrailer(title: Title): Promise<boolean> {
  const full = title.clips ? title : await loadDetail(title.id).catch(() => null);
  const key = full?.clips?.find((c) => c.key)?.key;
  if (!key) return false;
  openClip(key);
  return true;
}
