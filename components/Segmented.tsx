import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { Pressable } from '@/components/ui/Pressable';
import { springs } from '@/lib/motion';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  width?: number;
}

const PAD = 4;

/** Pill segmented control (All / My list). The white thumb glides between options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  width = 170,
}: SegmentedProps<T>) {
  const [inner, setInner] = useState(width - PAD * 2);
  const segment = inner / options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const x = useSharedValue(index * segment);

  useEffect(() => {
    x.value = withSpring(index * segment, springs.glide);
  }, [index, segment, x]);

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      className="h-9 flex-row rounded-full bg-s1 p-1"
      style={{ width }}
      onLayout={(e) => setInner(e.nativeEvent.layout.width - PAD * 2)}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: PAD,
            top: PAD,
            bottom: PAD,
            width: segment,
            borderRadius: 999,
            backgroundColor: colors.white,
          },
          thumb,
        ]}
      />
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="button"
          accessibilityState={{ selected: o.value === value }}
          scale={0.97}
          onPress={() => onChange(o.value)}
          className="flex-1 items-center justify-center">
          <Text className={`text-xs font-semibold ${o.value === value ? 'text-ink' : 'text-t2'}`}>
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
