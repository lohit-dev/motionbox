import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

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
 * Title logo scaled to fit a box while keeping its own proportions, so a wide wordmark and a
 * tall emblem both look right. Falls back to the name as text when there is no logo.
 */
export function TitleLogo({ title, maxWidth, maxHeight, fontSize = 40 }: TitleLogoProps) {
  const uri = imageUrl(title.logoPath, 'w500');
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSize(null);
    setFailed(false);
    if (!uri) return;
    let live = true;
    Image.getSize(
      uri,
      (w, h) => live && setSize({ w, h }),
      () => live && setFailed(true)
    );
    return () => {
      live = false;
    };
  }, [uri]);

  if (uri && !failed) {
    if (!size) return <View style={{ width: maxWidth, height: maxHeight * 0.5 }} />;
    const k = Math.min(maxWidth / size.w, maxHeight / size.h);
    return (
      <Image
        source={{ uri }}
        resizeMode="contain"
        accessibilityLabel={title.name}
        style={{ width: size.w * k, height: size.h * k }}
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
