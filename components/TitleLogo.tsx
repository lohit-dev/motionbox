import { useState } from 'react';
import { Image, Text } from 'react-native';

import { imageUrl } from '@/lib/tmdb';
import type { Title } from '@/types';

interface TitleLogoProps {
  title: Pick<Title, 'name' | 'logoPath'>;
  maxWidth: number;
  maxHeight: number;
  /** Font size for the plain text fallback */
  fontSize?: number;
}

/**
 * Title logo contained inside a fixed box, so unexpected image metadata cannot stretch it
 * beyond the hero or carousel. Falls back to the name as text when the logo is missing.
 */
export function TitleLogo({ title, maxWidth, maxHeight, fontSize = 40 }: TitleLogoProps) {
  const uri = imageUrl(title.logoPath, 'w500');
  const [failed, setFailed] = useState<string | null>(null);

  if (uri && failed !== uri) {
    return (
      <Image
        source={{ uri }}
        resizeMode="contain"
        accessibilityLabel={title.name}
        onError={() => setFailed(uri)}
        style={{ width: maxWidth, height: maxHeight }}
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
