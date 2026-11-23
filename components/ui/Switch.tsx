import { useEffect } from 'react';
import { Pressable as RNPressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import colors from '@/constants/colors';
import { springs } from '@/lib/motion';

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
}

/** Monochrome switch. The thumb springs across and the track fills white when on. */
export function Switch({ value, onValueChange, label }: SwitchProps) {
  const t = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    t.value = withSpring(value ? 1 : 0, springs.pop);
  }, [value, t]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.s3, colors.white]),
  }));
  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: 2 + t.value * 20 }],
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.t2, colors.ink]),
  }));

  return (
    <RNPressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      hitSlop={8}>
      <Animated.View
        style={[{ width: 50, height: 30, borderRadius: 15, justifyContent: 'center' }, track]}>
        <Animated.View style={[{ width: 26, height: 26, borderRadius: 13 }, thumb]} />
      </Animated.View>
    </RNPressable>
  );
}
