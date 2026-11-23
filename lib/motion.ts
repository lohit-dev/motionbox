import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/** Default ease-out used for entrances and tab changes. */
export const ease = Easing.bezierFn(0.2, 0.8, 0.2, 1);

/** Long, soft ease-out used for the card to detail flight. */
export const fly = Easing.bezierFn(0.22, 1, 0.36, 1);

export const springs = {
  /** Button press feedback: fast and tight. */
  press: { damping: 18, stiffness: 420, mass: 0.6 } satisfies WithSpringConfig,
  /** Small overshoot for pops, toggles and the tab capsule. */
  pop: { damping: 14, stiffness: 220, mass: 0.8 } satisfies WithSpringConfig,
  /** Settles without overshoot: sliding pills and thumbs. */
  glide: { damping: 22, stiffness: 240, mass: 0.9 } satisfies WithSpringConfig,
  /** Slower, softer settle for sheets and dismiss gestures. */
  soft: { damping: 20, stiffness: 180, mass: 1 } satisfies WithSpringConfig,
};

export const timing = (duration = 420): WithTimingConfig => ({ duration, easing: ease });

/** Delay for the nth item of a staggered list, capped so long lists do not drag. */
export const stagger = (index: number, step = 48, max = 9, base = 0) =>
  base + Math.min(index, max) * step;
