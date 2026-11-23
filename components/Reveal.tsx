import { memo, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ease, stagger } from '@/lib/motion';

interface RevealProps {
  /** Position in the list, drives the stagger delay */
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

// One builder per delay, built once. A new builder on every render makes Reanimated treat the
// view as reconfigured, and a list that re-renders would replay its entrance.
const builders = new Map<number, ReturnType<typeof build>>();
const build = (delay: number) => FadeInDown.delay(delay).duration(560).easing(ease);
const entering = (index: number) => {
  const delay = stagger(index);
  let b = builders.get(delay);
  if (!b) builders.set(delay, (b = build(delay)));
  return b;
};

/** Fades and rises into place when it mounts. Wrap list items to get a staggered entrance. */
export const Reveal = memo(function Reveal({ index = 0, children, style }: RevealProps) {
  return (
    <Animated.View entering={entering(index)} style={style}>
      {children}
    </Animated.View>
  );
});
