import { Image, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { initials } from '@/lib/format';
import { imageUrl } from '@/lib/tmdb';

interface AvatarProps {
  name: string;
  size?: number;
  /** TMDB profile path. Falls back to initials. */
  photoPath?: string | null;
}

/** Profile photo when there is one, otherwise initials in a grey circle. */
export function Avatar({ name, size = 80, photoPath }: AvatarProps) {
  const uri = imageUrl(photoPath, 'w342');
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border border-white/10 bg-s2"
      style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text className="font-bold text-white" style={{ fontSize: size * 0.32 }}>
          {initials(name)}
        </Text>
      )}
    </View>
  );
}
