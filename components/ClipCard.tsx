import { Image, Text, View } from 'react-native';

import { PosterArt } from '@/components/PosterArt';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import type { Clip, Title } from '@/types';

interface ClipCardProps {
  title: Title;
  clip: Clip;
  onPress?: () => void;
}

/** Landscape trailer or clip thumbnail with a duration chip. */
export function ClipCard({ title, clip, onPress }: ClipCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={clip.title}
      scale={0.97}
      onPress={onPress}
      style={{ width: 220 }}>
      <View>
        {clip.key ? (
          <View className="overflow-hidden rounded-[16px] border border-white/10 bg-s1">
            <Image
              source={{ uri: `https://img.youtube.com/vi/${clip.key}/hqdefault.jpg` }}
              style={{ width: 220, height: 124 }}
              resizeMode="cover"
            />
          </View>
        ) : (
          <PosterArt title={title} width={220} height={124} radius={16} />
        )}
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-black/55 pl-0.5">
            <Icon name="play" size={16} />
          </View>
        </View>
        <View className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5">
          <Text
            className="text-[11px] font-semibold text-white"
            style={{ fontVariant: ['tabular-nums'] }}>
            {clip.length}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} className="mt-2 text-[13px] font-semibold text-white">
        {clip.title}
      </Text>
    </Pressable>
  );
}
