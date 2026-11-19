import { Text, View } from 'react-native';

import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { ProgressBar } from '@/components/ProgressBar';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { runtimeMinutes, timeLeft } from '@/lib/format';
import type { Title } from '@/types';

interface ContinueCardProps {
  title: Title;
  percent: number;
  onPress?: (title: Title) => void;
  onLongPress?: (title: Title) => void;
}

const W = 236;
const H = 133;

/** Landscape resume card with a progress line. Long press for options. */
export function ContinueCard({ title, percent, onPress, onLongPress }: ContinueCardProps) {
  const minutes = title.kind === 'movie' ? runtimeMinutes(title.runtime) : 48;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue ${title.name}`}
      scale={0.97}
      onPress={() => onPress?.(title)}
      onLongPress={() => onLongPress?.(title)}
      style={{ width: W }}>
      <View style={{ width: W, height: H }}>
        <PosterArt title={title} width={W} height={H} radius={18} />
        <Fade hold={0.35} />
        <View className="absolute bottom-3 left-3.5 right-3.5">
          <View className="flex-row items-center justify-between">
            <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-white">
              {title.name}
            </Text>
            <Icon name="play" size={14} />
          </View>
          <Text className="mb-2 mt-0.5 text-[11.5px] text-t2">{timeLeft(minutes, percent)}</Text>
          <ProgressBar percent={percent} />
        </View>
      </View>
    </Pressable>
  );
}
