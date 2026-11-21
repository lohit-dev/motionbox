import { useRouter } from 'expo-router';
import { Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { Wordmark } from '@/components/Wordmark';
import { Pill } from '@/components/ui/Pill';
import { useHome } from '@/hooks/useHome';
import { ease } from '@/lib/motion';
import { useApp } from '@/store/store';

/** First launch: a wall of artwork and one white pill. */
export default function Welcome() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const finish = useApp((s) => s.finishOnboarding);
  const col = (width - 40 - 16) / 3;
  const { trending } = useHome();
  // Three columns of three posters. Quiet grey tiles hold the place until artwork arrives.
  const wall = [0, 1, 2].map((c) => [0, 1, 2].map((r) => trending[c * 3 + r] ?? null));

  return (
    <View className="flex-1 bg-ink">
      <View
        className="flex-row gap-2 px-gutter"
        style={{ height: height * 0.62, overflow: 'hidden', paddingTop: 56 }}>
        {wall.map((c, ci) => (
          <View key={ci} className="gap-2" style={{ marginTop: ci === 1 ? 40 : 0 }}>
            {c.map((t, ri) =>
              t ? (
                <PosterArt key={t.id} title={t} width={col} height={col * 1.5} radius={14} />
              ) : (
                <View
                  key={ri}
                  className="bg-s1"
                  style={{ width: col, height: col * 1.5, borderRadius: 14 }}
                />
              )
            )}
          </View>
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
        <Text className="mt-3 text-[28px] font-extrabold leading-[30px] tracking-tighter text-white">
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
