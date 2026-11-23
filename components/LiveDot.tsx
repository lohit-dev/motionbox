import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import colors from '@/constants/colors';

/** The one place green is used: a pulsing dot for "airing now". */
export function LiveDot({ size = 11 }: { size?: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, [t]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - t.value),
    transform: [{ scale: 1 + t.value * 1.9 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: size,
            backgroundColor: colors.live,
          },
          ring,
        ]}
      />
      <View
        style={{ width: size, height: size, borderRadius: size, backgroundColor: colors.live }}
      />
    </View>
  );
}
