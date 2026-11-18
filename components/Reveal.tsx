import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ease, stagger } from '@/lib/motion';

interface RevealProps {
  /** Position in the list, drives the stagger delay */
  index?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Fades and rises into place when it mounts. Wrap list items to get a staggered entrance. */
export function Reveal({ index = 0, children, style }: RevealProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(stagger(index)).duration(560).easing(ease)}
      style={style}>
      {children}
    </Animated.View>
  );
}
