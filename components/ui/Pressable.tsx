import { useState } from 'react';
import { Pressable as RNPressable, type PressableProps } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  /** Scale while pressed. */
  scale?: number;
  className?: string;
  style?: object;
}

/**
 * Pressable that shrinks slightly under the finger.
 * className goes straight to the core Pressable so NativeWind always resolves it;
 * the press scale is plain state rather than an animated wrapper.
 */
export function Pressable({ scale = 0.96, style, onPressIn, onPressOut, ...rest }: Props) {
  const [down, setDown] = useState(false);

  return (
    <RNPressable
      {...rest}
      onPressIn={(e) => {
        setDown(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setDown(false);
        onPressOut?.(e);
      }}
      style={[style, down ? { transform: [{ scale }] } : null]}
    />
  );
}
