import { Text, View } from 'react-native';

import { initials } from '@/lib/format';

interface AvatarProps {
  name: string;
  size?: number;
}

/** Initials in a grey circle, used for cast, reviewers and the profile. */
export function Avatar({ name, size = 80 }: AvatarProps) {
  return (
    <View
      className="items-center justify-center rounded-full border border-white/10 bg-s2"
      style={{ width: size, height: size }}>
      <Text className="font-bold text-white" style={{ fontSize: size * 0.32 }}>
        {initials(name)}
      </Text>
    </View>
  );
}
