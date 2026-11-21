import { useEffect, useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/lib/motion';

/**
 * Horizontal swipe that moves between tabs or days. The content follows the finger a little,
 * then springs back while the new tab takes over. `go(1)` is the next one, `go(-1)` the one
 * before; the caller ignores moves past either end.
 *
 * Vertical scrolling is untouched: the swipe only starts after a clear sideways move, and it
 * gives up as soon as the finger travels up or down.
 */
export function useSwipe(go: (direction: 1 | -1) => void) {
  const latest = useRef(go);
  useEffect(() => {
    latest.current = go;
  });
  const call = (direction: 1 | -1) => latest.current(direction);

  const x = useSharedValue(0);
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-20, 20])
        .failOffsetY([-16, 16])
        .onUpdate((e) => {
          x.set(e.translationX * 0.25);
        })
        .onEnd((e) => {
          const far = Math.abs(e.translationX) > 64 || Math.abs(e.velocityX) > 650;
          if (far) runOnJS(call)(e.translationX < 0 ? 1 : -1);
        })
        .onFinalize(() => {
          x.set(withSpring(0, springs.soft));
        }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [x]
  );
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return { gesture, style };
}
