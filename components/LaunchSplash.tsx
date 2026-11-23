import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Mark } from '@/components/Mark';
import { Wordmark } from '@/components/Wordmark';
import colors from '@/constants/colors';

/** Same size the native splash draws the mark at (200pt wide image, mark is 680 of 1024) */
const MARK = 133;

/**
 * Launch intro. The mark sits exactly where the native splash left it, the wordmark rises in
 * under it, then the whole layer lifts away.
 */
export function LaunchSplash() {
  const [gone, setGone] = useState(false);
  const word = useSharedValue(0);
  const layer = useSharedValue(1);

  useEffect(() => {
    word.value = withDelay(
      150,
      withTiming(1, { duration: 600, easing: Easing.bezier(0.22, 1, 0.36, 1) })
    );
    layer.value = withDelay(
      1300,
      withTiming(0, { duration: 420, easing: Easing.out(Easing.quad) }, (done) => {
        if (done) runOnJS(setGone)(true);
      })
    );
  }, [word, layer]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: (1 - word.value) * 12 }],
  }));
  const layerStyle = useAnimatedStyle(() => ({
    opacity: layer.value,
    transform: [{ scale: 1 + (1 - layer.value) * 0.08 }],
  }));

  if (gone) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.layer, layerStyle]}>
      <Mark size={MARK} />
      <Animated.View style={[{ marginTop: 26 }, wordStyle]}>
        <Wordmark size={30} />
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
});
