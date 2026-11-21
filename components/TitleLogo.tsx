import { useState } from 'react';
import { Image, Text } from 'react-native';

import { imageUrl } from '@/lib/tmdb';
import type { Title } from '@/types';

interface TitleLogoProps {
  title: Pick<Title, 'name' | 'logoPath' | 'logoRatio'>;
  maxWidth: number;
  maxHeight: number;
  /** Font size for the plain text fallback */
  fontSize?: number;
}

/**
 * Title logo scaled to fit a box while keeping its own proportions, so a wide wordmark and a
 * tall emblem both look right. The ratio comes with the title data, so the logo is sized on
 * the first render and never pops in after a measuring pass. Falls back to the name as text
 * when there is no logo or it fails to load.
 */
export function TitleLogo({ title, maxWidth, maxHeight, fontSize = 40 }: TitleLogoProps) {
  const uri = imageUrl(title.logoPath, 'w500');
  const ratio = title.logoRatio && title.logoRatio > 0 ? title.logoRatio : null;
  const [failed, setFailed] = useState<string | null>(null);

  if (uri && ratio && failed !== uri) {
    const w = Math.min(maxWidth, maxHeight * ratio);
    return (
      <Image
        source={{ uri }}
        resizeMode="contain"
        accessibilityLabel={title.name}
        onError={() => setFailed(uri)}
        style={{ width: w, height: w / ratio }}
      />
    );
  }

  return (
    <Text
      numberOfLines={2}
      className="text-center font-extrabold tracking-tighter text-white"
      style={{ fontSize, lineHeight: fontSize * 1.06, maxWidth }}>
      {title.name}
    </Text>
  );
}
