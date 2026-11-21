import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface FadeImageProps {
  uri: string;
  /** Milliseconds to fade in once loaded. 0 shows it as soon as it has loaded. */
  duration?: number;
  onLoad?: () => void;
}

/**
 * Image that fades in when it has loaded, on the UI thread: no state, no re-render. Stack it
 * over a lower resolution copy and the swap is a cross-fade instead of a pop.
 */
export function FadeImage({ uri, duration = 180, onLoad }: FadeImageProps) {
  const opacity = useSharedValue(duration ? 0 : 1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, style]}
      resizeMode="cover"
      onLoad={() => {
        if (duration) opacity.set(withTiming(1, { duration }));
        onLoad?.();
      }}
    />
  );
}
