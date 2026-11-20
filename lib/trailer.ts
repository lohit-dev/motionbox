import { Linking } from 'react-native';

import { loadDetail } from '@/lib/api';
import type { Title } from '@/types';

const watchUrl = (key: string) => `https://www.youtube.com/watch?v=${key}`;

/** Opens a clip on YouTube. */
export const openClip = (key: string) => Linking.openURL(watchUrl(key));

/** Opens a title's best trailer on YouTube, loading its detail first when needed. Returns false when there is none. */
export async function openTrailer(title: Title): Promise<boolean> {
  const full = title.clips ? title : await loadDetail(title.id).catch(() => null);
  const key = full?.clips?.find((c) => c.key)?.key;
  if (!key) return false;
  await openClip(key);
  return true;
}
