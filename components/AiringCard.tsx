import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { LiveDot } from '@/components/LiveDot';
import { PosterArt } from '@/components/PosterArt';
import type { AiringEntry, Title } from '@/types';

interface AiringCardProps {
  entry: AiringEntry;
  title: Title;
  reminded: boolean;
  onToggleReminder: (id: string) => void;
  onPress?: (title: Title, tag: string) => void;
}

export function AiringCard({ entry, title, reminded, onToggleReminder, onPress }: AiringCardProps) {
  const live = entry.time === 'Now';
  const sharedTag = `airing-${title.id}-${entry.time}`;
  const rotate = useSharedValue(0);
  const wiggle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotate.value}deg` }] }));

  const ring = () => {
    rotate.value = withSequence(
      withTiming(-22, { duration: 80 }),
      withTiming(18, { duration: 110 }),
      withTiming(-12, { duration: 110 }),
      withTiming(6, { duration: 110 }),
      withTiming(0, { duration: 120 })
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title.name}
      scale={0.985}
      onPress={() => onPress?.(title, sharedTag)}
      className="flex-row items-center gap-3 rounded-[22px] bg-s1 py-3.5 pl-3 pr-3.5">
      <Animated.View sharedTransitionTag={sharedTag} style={{ width: 56, height: 84 }}>
        <PosterArt title={title} width={56} height={84} radius={12} size="w342" />
      </Animated.View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-lg tracking-tight text-white font-bold">
          {title.name}
        </Text>
        <Text className="mt-1 text-[12.5px] text-t3">
          {entry.episode.split(' · ').slice(0, 2).join(' · ')}
        </Text>
        {live ? (
          <View className="mt-1.5 flex-row items-center gap-2">
            <LiveDot />
            <Text className="text-[15px] text-live font-semibold">Airing now</Text>
          </View>
        ) : (
          <Text className="mt-1.5 text-[15px] text-white font-medium">{entry.time}</Text>
        )}
      </View>
      <CircleButton
        label={reminded ? 'Remove reminder' : 'Remind me'}
        active={reminded}
        size={46}
        onPress={() => {
          ring();
          onToggleReminder(title.id);
        }}>
        <Animated.View style={wiggle}>
          <Icon
            name="bell"
            size={19}
            color={reminded ? colors.ink : colors.white}
            filled={reminded}
          />
        </Animated.View>
      </CircleButton>
    </Pressable>
  );
}
