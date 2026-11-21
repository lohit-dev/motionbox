import { useEffect } from 'react';
import type { ComponentProps } from 'react';
import { Pressable as RNPressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { springs } from '@/lib/motion';

const tabEase = Easing.bezier(0.2, 0.8, 0.2, 1);

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  search: { icon: 'search', label: 'Search' },
  library: { icon: 'bookmark', label: 'Library' },
  airing: { icon: 'calendar', label: 'Airing' },
};

function TabItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  // 0 = idle, 1 = active. The capsule widens, fills white and the label slides open together.
  const on = useSharedValue(focused ? 1 : 0);
  const pop = useSharedValue(1);

  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, { duration: 380, easing: tabEase });
    if (focused) {
      pop.value = 0.55;
      pop.value = withSpring(1, springs.pop);
    }
  }, [focused, on, pop]);

  const capsule = useAnimatedStyle(() => ({
    flexGrow: 1 + on.value * 1.4,
    backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0)', colors.white]),
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const darkIcon = useAnimatedStyle(() => ({ opacity: on.value }));
  const lightIcon = useAnimatedStyle(() => ({ opacity: 1 - on.value }));
  const text = useAnimatedStyle(() => ({ opacity: on.value, maxWidth: on.value * 90 }));

  return (
    <Animated.View
      style={[{ flexBasis: 0, height: 48, borderRadius: 24, overflow: 'hidden' }, capsule]}>
      <RNPressable
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
        <Animated.View style={iconStyle}>
          <Animated.View style={lightIcon}>
            <Icon name={icon} size={22} color={colors.t2} />
          </Animated.View>
          <Animated.View style={[{ position: 'absolute' }, darkIcon]}>
            <Icon name={icon} size={22} color={colors.ink} filled={icon === 'bookmark'} />
          </Animated.View>
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[{ color: colors.ink, fontSize: 15, fontWeight: '700' }, text]}>
          {label}
        </Animated.Text>
      </RNPressable>
    </Animated.View>
  );
}

/** Flat docked tab bar. The active tab is a white capsule that springs open. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const padBottom = Math.max(bottom, 12);

  return (
    <View
      className="flex-row gap-1.5 border-t border-s3 bg-ink px-3.5 pt-2.5"
      style={{ paddingBottom: padBottom }}>
      {state.routes.map((route, i) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === i;
        return (
          <TabItem
            key={route.key}
            focused={focused}
            icon={meta.icon}
            label={meta.label}
            onPress={() => {
              const event = emitter.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
          />
        );
      })}
    </View>
  );
}
