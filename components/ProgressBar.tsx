import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { clamp } from '@/lib/format';
import { timing } from '@/lib/motion';

interface ProgressBarProps {
  /** 0-100 */
  percent: number;
  height?: number;
}

/** Thin white progress line. Grows to its value on mount and whenever it changes. */
export function ProgressBar({ percent, height = 3 }: ProgressBarProps) {
  const value = useSharedValue(0);
  useEffect(() => {
    value.value = withTiming(clamp(percent, 0, 100), timing(800));
  }, [percent, value]);
  const fill = useAnimatedStyle(() => ({ width: `${value.value}%` }));

  return (
    <View
      className="overflow-hidden rounded-full bg-white/25"
      style={{ height }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}>
      <Animated.View style={[{ height, borderRadius: height, backgroundColor: '#fff' }, fill]} />
    </View>
  );
}
