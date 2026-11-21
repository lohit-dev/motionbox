import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable as RNPressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { ease, fly, springs } from '@/lib/motion';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  height?: number;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet. Slides up with a long ease-out and follows the finger when you drag the
 * handle or title down. Releasing past a quarter of the height, or flicking, closes it.
 */
export function Sheet({ visible, onClose, height = 520, title, children }: SheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const y = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      y.value = height;
      y.value = withTiming(0, { duration: 420, easing: fly });
    } else {
      y.value = withTiming(height, { duration: 300, easing: ease }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible, height, y]);

  const pan = Gesture.Pan()
    .onChange((e) => {
      y.value = Math.max(0, y.value + e.changeY);
    })
    .onEnd((e) => {
      if (y.value > height * 0.25 || e.velocityY > 800) runOnJS(onClose)();
      else y.value = withSpring(0, springs.soft);
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, y.value / height) }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }, scrimStyle]}>
          <RNPressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height,
              backgroundColor: colors.s1,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: bottom,
              overflow: 'hidden',
            },
            sheetStyle,
          ]}>
          <GestureDetector gesture={pan}>
            <View collapsable={false} className="items-center pb-3 pt-2.5">
              <View className="h-1 w-10 rounded-full bg-white/30" />
              {title ? <Text className="mt-4 text-xl font-bold text-white">{title}</Text> : null}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
