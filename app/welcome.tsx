import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { Wordmark } from '@/components/Wordmark';
import { Pill } from '@/components/ui/Pill';
import { useHome } from '@/hooks/useHome';
import { ease } from '@/lib/motion';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

/** First launch: a wall of artwork and one white pill. */
export default function Welcome() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const finish = useApp((s) => s.finishOnboarding);
  const col = (width - 40 - 16) / 3;
  const { trending } = useHome();
  // Three columns of four posters that drift past, the middle one the other way
  const wall = [0, 1, 2].map((c) => [0, 1, 2, 3].map((r) => trending[c * 4 + r] ?? null));

  return (
    <View className="flex-1 bg-ink">
      <View
        className="flex-row gap-2 px-gutter"
        style={{ height: height * 0.62, overflow: 'hidden' }}>
        {wall.map((c, ci) => (
          <Drift key={ci} items={c} col={col} up={ci !== 1} seconds={ci === 1 ? 46 : 38} />
        ))}
      </View>
      <View
        className="absolute left-0 right-0"
        style={{ top: height * 0.3, height: height * 0.34 }}>
        <Fade />
      </View>
      <Animated.View
        entering={FadeInDown.delay(200).duration(700).easing(ease)}
        className="absolute left-gutter right-gutter"
        style={{ bottom: bottom + 28 }}>
        <Wordmark size={34} />
        <Text className="mt-3 text-[28px] leading-[30px] tracking-tighter text-white font-extrabold">
          Everything you watch, in one place.
        </Text>
        <Text className="mt-3 text-[15px] leading-[22px] text-t2">
          New trailers, episodes and release dates, all in one place.
        </Text>
        <View className="mt-6">
          <Pill
            title="Get started"
            onPress={() => {
              finish();
              router.replace('/');
            }}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const GAP = 8;

/** One column of posters that scrolls forever. The list is drawn twice so the loop has no seam. */
function Drift({
  items,
  col,
  up,
  seconds,
}: {
  items: (Title | null)[];
  col: number;
  up: boolean;
  seconds: number;
}) {
  const loop = items.length * (col * 1.5 + GAP);
  const y = useSharedValue(up ? 0 : -loop);

  useEffect(() => {
    y.value = up ? 0 : -loop;
    y.value = withRepeat(
      withTiming(up ? -loop : 0, { duration: seconds * 1000, easing: Easing.linear }),
      -1,
      false
    );
  }, [y, loop, up, seconds]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const tile = (t: Title | null, key: string) =>
    t ? (
      <PosterArt key={key} title={t} width={col} height={col * 1.5} radius={14} />
    ) : (
      <View
        key={key}
        className="bg-s1"
        style={{ width: col, height: col * 1.5, borderRadius: 14 }}
      />
    );

  return (
    <Animated.View style={[{ gap: GAP, paddingTop: 56 }, style]}>
      {items.map((t, i) => tile(t, `a${i}`))}
      {items.map((t, i) => tile(t, `b${i}`))}
    </Animated.View>
  );
}
