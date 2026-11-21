import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';

/** Short branded intro: "m." rises in, holds, then the whole layer fades off. */
export function LaunchSplash() {
  const [gone, setGone] = useState(false);
  const mark = useSharedValue(0);
  const layer = useSharedValue(1);

  useEffect(() => {
    mark.value = withTiming(1, { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    layer.value = withDelay(
      1100,
      withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(setGone)(true);
      })
    );
  }, [mark, layer]);

  const markStyle = useAnimatedStyle(() => ({
    opacity: mark.value,
    transform: [{ translateY: (1 - mark.value) * 14 }, { scale: 0.92 + mark.value * 0.08 }],
  }));
  const layerStyle = useAnimatedStyle(() => ({ opacity: layer.value }));

  if (gone) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer, layerStyle]}>
      <Animated.View style={markStyle}>
        <View className="flex-row items-baseline">
          <Text className="font-extrabold tracking-tighter text-white" style={styles.m}>
            m
          </Text>
          <Text className="font-extrabold text-white" style={styles.m}>
            .
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  m: { fontSize: 72 },
});
