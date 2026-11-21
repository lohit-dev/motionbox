import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import colors from '@/constants/colors';

interface SliderProps {
  /** 0 to max, in `step` increments */
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: number;
}

const THUMB = 26;

/** Single-thumb slider with a white fill, used for the minimum score. */
export function Slider({ value, onChange, max = 10, step = 0.5 }: SliderProps) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const span = Math.max(1, width - THUMB);

  const setFrom = (px: number) => {
    const ratio = Math.min(1, Math.max(0, px / span));
    const next = Math.round((ratio * max) / step) * step;
    onChange(next);
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      runOnJS(setFrom)(e.x - THUMB / 2);
    })
    .onUpdate((e) => {
      runOnJS(setFrom)(e.x - THUMB / 2);
    });

  const left = (value / max) * span;
  useEffect(() => {
    x.value = left;
  }, [left, x]);
  const fill = useAnimatedStyle(() => ({ width: x.value + THUMB / 2 }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ height: 40, justifyContent: 'center' }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.s3 }}>
          <Animated.View
            style={[{ height: 4, borderRadius: 2, backgroundColor: colors.white }, fill]}
          />
        </View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: 0,
              width: THUMB,
              height: THUMB,
              borderRadius: THUMB / 2,
              backgroundColor: colors.white,
            },
            thumb,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
