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
 * className goes straight to the core Pressable so NativeWind always resolves it. The style is
 * a plain object, never a function: NativeWind drops className styles next to a style function,
 * which is what made backgrounds, borders and sizes vanish. Only this small component
 * re-renders while pressed.
 */
export function Pressable({ scale = 0.96, style, onPressIn, onPressOut, ...rest }: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <RNPressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={pressed ? [style, { transform: [{ scale }] }] : style}
    />
  );
}
