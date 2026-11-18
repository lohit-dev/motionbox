import { Pressable as RNPressable, type PressableProps } from 'react-native';
import { cssInterop } from 'nativewind';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);
cssInterop(AnimatedPressable, { className: 'style' });

interface Props extends Omit<PressableProps, 'style'> {
  /** Scale while pressed. Release springs back. */
  scale?: number;
  className?: string;
  style?: object;
}

/** Pressable that shrinks slightly under the finger and springs back on release. */
export function Pressable({ scale = 0.96, style, onPressIn, onPressOut, ...rest }: Props) {
  const s = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        s.value = withSpring(scale, springs.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, springs.pop);
        onPressOut?.(e);
      }}
      style={[animated, style]}
    />
  );
}
