import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import colors from '@/constants/colors';
import { Pressable } from '@/components/ui/Pressable';
import { springs } from '@/lib/motion';
import type { WeekDay } from '@/lib/calendar';

interface WeekStripProps {
  days: WeekDay[];
  selected: number;
  onSelect: (index: number) => void;
}

const HEIGHT = 74;

/** Week at a glance. A tall white pill slides to the selected day. */
export function WeekStrip({ days, selected, onSelect }: WeekStripProps) {
  const [width, setWidth] = useState(0);
  const cell = width / days.length;
  const x = useSharedValue(selected * cell);

  useEffect(() => {
    x.value = withSpring(selected * cell, springs.pop);
  }, [selected, cell, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      className="mx-3 flex-row"
      style={{ height: HEIGHT }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: cell,
              height: HEIGHT,
              borderRadius: 28,
              backgroundColor: colors.white,
            },
            pill,
          ]}
        />
      ) : null}
      {days.map((d) => {
        const on = d.index === selected;
        return (
          <Pressable
            key={d.index}
            accessibilityRole="button"
            accessibilityLabel={`${d.weekday} ${d.date}`}
            accessibilityState={{ selected: on }}
            scale={0.94}
            onPress={() => onSelect(d.index)}
            className="flex-1 items-center justify-center gap-2">
            <Text className={`text-[14.5px] font-medium ${on ? 'text-ink' : 'text-t3'}`}>
              {d.weekday}
            </Text>
            <Text className={`text-[21px] font-bold ${on ? 'text-ink' : 'text-t3'}`}>{d.date}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
