import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import colors from '@/constants/colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Grey placeholder that breathes while content loads. */
export function Skeleton({ width = '100%', height, radius = 14, style }: SkeletonProps) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);
  const animated = useAnimatedStyle(() => ({ opacity: 0.5 + pulse.value * 0.5 }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: colors.s2 }, animated, style]}
    />
  );
}
