import { useEffect, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { ease, springs } from '@/lib/motion';

interface SwipeOptions {
  /** Is there a next / previous page to go to? Past either end the content resists instead. */
  next: boolean;
  prev: boolean;
}

/**
 * Horizontal swipe between tabs or days. The content follows the finger one to one. Let go past
 * a quarter of the width (or with a flick) and the page slides off, the next one slides in from
 * the other side. Let go short of that and it springs back.
 *
 * Vertical scrolling is untouched: the swipe only starts after a clear sideways move and gives
 * up as soon as the finger travels up or down.
 */
export function useSwipe(go: (direction: 1 | -1) => void, { next, prev }: SwipeOptions) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const hasNext = useSharedValue(next);
  const hasPrev = useSharedValue(prev);
  useEffect(() => {
    hasNext.set(next);
    hasPrev.set(prev);
  }, [next, prev, hasNext, hasPrev]);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-16, 16])
        .failOffsetY([-14, 14])
        .onUpdate((e) => {
          const allowed = e.translationX < 0 ? hasNext.value : hasPrev.value;
          x.set(allowed ? e.translationX : e.translationX * 0.2);
        })
        .onEnd((e) => {
          const direction = e.translationX < 0 ? 1 : -1;
          const allowed = direction === 1 ? hasNext.value : hasPrev.value;
          const far = Math.abs(e.translationX) > width * 0.25 || Math.abs(e.velocityX) > 600;
          if (!allowed || !far) {
            x.set(withSpring(0, springs.soft));
            return;
          }
          // Out one side, swap the page, in from the other
          x.set(
            withTiming(
              -direction * width,
              { duration: 150, easing: Easing.in(Easing.quad) },
              (done) => {
                if (!done) return;
                runOnJS(go)(direction);
                x.set(direction * width * 0.45);
                x.set(withTiming(0, { duration: 260, easing: ease }));
              }
            )
          );
        }),
    [x, width, go, hasNext, hasPrev]
  );

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(x.value), [0, width * 0.6], [1, 0.25], Extrapolation.CLAMP),
    transform: [{ translateX: x.value }],
  }));
  return { gesture, style };
}
