import { Image, Text, View } from 'react-native';

import { imageUrl, type PosterSize } from '@/lib/tmdb';
import type { Title } from '@/types';

interface PosterArtProps {
  title: Pick<Title, 'name' | 'posterPath'>;
  width: number;
  height: number;
  radius?: number;
  size?: PosterSize;
  /** Hairline border, off for full-bleed heroes */
  bordered?: boolean;
}

/** Poster image with a quiet grey fallback that shows the title until artwork loads. */
export function PosterArt({
  title,
  width,
  height,
  radius = 14,
  size = 'w342',
  bordered = true,
}: PosterArtProps) {
  const uri = imageUrl(title.posterPath, size);
  return (
    <View
      className={`overflow-hidden bg-s1 ${bordered ? 'border border-white/10' : ''}`}
      style={{ width, height, borderRadius: radius }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View className="flex-1 items-center justify-center bg-s2 p-2">
          <Text numberOfLines={3} className="text-center text-xs font-bold text-t2">
            {title.name}
          </Text>
        </View>
      )}
    </View>
  );
}
