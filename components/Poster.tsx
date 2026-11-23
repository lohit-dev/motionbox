import { memo, useId } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { PosterArt } from '@/components/PosterArt';
import { hasScore, kindLine } from '@/lib/format';
import { sz } from '@/lib/scale';
import type { Title } from '@/types';

interface PosterProps {
  title: Title;
  width?: number;
  /** Small white pill on the poster, for example NEW */
  tag?: string;
  /** Grey chip at the bottom left of the poster, for example a release date */
  date?: string;
  showScore?: boolean;
  subtitle?: string;
  /** Receives the shared transition tag of this poster, so the detail hero can take over from it */
  onPress?: (title: Title, tag: string) => void;
}

function PosterBase({
  title,
  width = sz(112),
  tag,
  date,
  showScore = false,
  subtitle,
  onPress,
}: PosterProps) {
  // One tag per card on screen: the same title can sit in several rails at once
  const sharedTag = `poster-${title.id}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title.name}
      scale={0.955}
      onPress={() => onPress?.(title, sharedTag)}
      style={{ width }}>
      <View>
        <Animated.View sharedTransitionTag={sharedTag} style={{ width, height: width * 1.5 }}>
          <PosterArt title={title} width={width} height={width * 1.5} />
        </Animated.View>
        {showScore && hasScore(title) ? (
          <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-black/65 px-2 py-1">
            <Icon name="star" size={10} />
            <Text className="text-[11px] text-white font-semibold">{title.score.toFixed(1)}</Text>
          </View>
        ) : null}
        {tag ? (
          <View className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-1">
            <Text className="text-[10.5px] tracking-wide text-ink font-extrabold">{tag}</Text>
          </View>
        ) : null}
        {date ? (
          <View className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2.5 py-1">
            <Text className="text-[11px] text-white font-bold">{date}</Text>
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={1}
        style={{ width }}
        className="mt-2 text-[13px] text-white font-semibold">
        {title.name}
      </Text>
      <Text numberOfLines={1} style={{ width }} className="mt-0.5 text-xs text-t3">
        {subtitle ?? kindLine(title)}
      </Text>
    </Pressable>
  );
}

export const Poster = memo(PosterBase);
