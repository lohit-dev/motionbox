import { Pressable as RNPressable, type PressableProps } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  /** Scale while pressed. */
  scale?: number;
  className?: string;
  style?: object;
}

/**
 * Pressable that shrinks slightly under the finger.
 * className goes straight to the core Pressable so NativeWind always resolves it. The pressed
 * state lives inside the core Pressable, so pressing never re-renders the screen around it.
 */
export function Pressable({ scale = 0.96, style, ...rest }: Props) {
  return (
    <RNPressable
      {...rest}
      style={({ pressed }) => [style, pressed ? { transform: [{ scale }] } : null]}
    />
  );
}
