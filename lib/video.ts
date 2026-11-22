import type { VideoPlayer } from 'expo-video';

import { qualityHeight, type StreamQuality } from '@/lib/youtube';

/** Set Expo Video's adaptive stream ceiling without mutating the hook-owned player inline. */
export function setVideoQuality(player: VideoPlayer, quality: StreamQuality, portrait = false) {
  const height = qualityHeight(quality);
  const longSide = height ? Math.round((height * 16) / 9) : 0;
  player.maxResolution = height
    ? portrait
      ? { width: height, height: longSide }
      : { width: longSide, height }
    : null;
}
