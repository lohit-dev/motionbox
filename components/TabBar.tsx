import { useEffect } from 'react';
import type { ComponentProps } from 'react';
import { Pressable as RNPressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';
import { springs } from '@/lib/motion';

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
  const pop = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      pop.value = 0.55;
      pop.value = withSpring(1, springs.pop);
    }
  }, [focused, pop]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(22).stiffness(240)}
      style={{
        flex: focused ? 2.4 : 1,
        height: 48,
        borderRadius: 24,
        backgroundColor: focused ? colors.white : 'transparent',
        overflow: 'hidden',
      }}>
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
          <Icon
            name={icon}
            size={22}
            color={focused ? colors.ink : colors.t2}
            filled={focused && icon === 'bookmark'}
          />
        </Animated.View>
        {focused ? (
          <Animated.Text
            entering={FadeIn.duration(220)}
            exiting={FadeOut.duration(100)}
            numberOfLines={1}
            style={{ color: colors.ink, fontSize: 15, fontWeight: '700' }}>
            {label}
          </Animated.Text>
        ) : null}
      </RNPressable>
    </Animated.View>
  );
}

/** Flat docked tab bar. The active tab is a white capsule that springs open. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      className="flex-row gap-1.5 border-t border-s3 bg-ink px-3.5 pt-2.5"
      style={{ paddingBottom: Math.max(bottom, 12) }}>
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
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented)
                navigation.navigate(route.name, route.params);
            }}
          />
        );
      })}
    </View>
  );
}
