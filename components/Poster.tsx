import { useRef } from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { PosterArt } from '@/components/PosterArt';
import { kindLine } from '@/lib/format';
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
  /** Receives the artwork view so the caller can fly it into the detail page */
  onPress?: (title: Title, art: View | null) => void;
}

export function Poster({
  title,
  width = 112,
  tag,
  date,
  showScore = false,
  subtitle,
  onPress,
}: PosterProps) {
  const art = useRef<View>(null);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title.name}
      scale={0.955}
      onPress={() => onPress?.(title, art.current)}
      style={{ width }}>
      <View ref={art} collapsable={false}>
        <PosterArt title={title} width={width} height={width * 1.5} />
        {showScore ? (
          <View className="absolute left-1.5 top-1.5 flex-row items-center gap-1 rounded-full bg-black/65 px-2 py-1">
            <Icon name="star" size={10} />
            <Text className="text-[11px] font-semibold text-white">{title.score.toFixed(1)}</Text>
          </View>
        ) : null}
        {tag ? (
          <View className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-1">
            <Text className="text-[10.5px] font-extrabold tracking-wide text-ink">{tag}</Text>
          </View>
        ) : null}
        {date ? (
          <View className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-white">{date}</Text>
          </View>
        ) : null}
      </View>
      <Text numberOfLines={1} className="mt-2 text-[13px] font-semibold text-white">
        {title.name}
      </Text>
      <Text numberOfLines={1} className="mt-0.5 text-xs text-t3">
        {subtitle ?? kindLine(title)}
      </Text>
    </Pressable>
  );
}
