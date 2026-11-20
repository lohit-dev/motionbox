import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import type { ViewToken } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { captions, ringIds } from '@/data/extras';
import { getTitle } from '@/data/titles';
import { genreLine } from '@/lib/format';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

const SLIDE_MS = 7000;

/** Vertical trailer feed. One full-screen trailer per page, snaps like Reels. */
export default function Trailers() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { saved, toggleSave } = useApp();
  const items = ringIds.map((id) => getTitle(id)).filter((t): t is Title => !!t);
  const list = useRef<FlatList<Title>>(null);
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const next = useCallback(
    (from: number) => {
      if (from + 1 < items.length) list.current?.scrollToIndex({ index: from + 1, animated: true });
    },
    [items.length]
  );

  // The line at the top of each page fills over SLIDE_MS, then the feed moves on.
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(next)(index);
    });
  }, [index, next, progress]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0]?.index;
    if (first != null) setIndex(first);
  }).current;

  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        ref={list}
        data={items}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        keyExtractor={(t) => t.id}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        onViewableItemsChanged={onViewable}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        renderItem={({ item }) => {
          const lines = captions[item.id] ?? [];
          const isSaved = saved.includes(item.id);
          return (
            <View style={{ width, height }}>
              <PosterArt
                title={item}
                width={width}
                height={height}
                radius={0}
                size="w1280"
                bordered={false}
              />
              <Fade hold={0.3} />
              <View className="absolute left-gutter right-20" style={{ bottom: bottom + 28 }}>
                <Text className="text-eyebrow font-semibold uppercase text-t2">
                  {genreLine(item, 3)}
                </Text>
                <Text className="mt-1.5 text-[36px] font-extrabold leading-[38px] tracking-tighter text-white">
                  {item.name}
                </Text>
                {lines[0] ? (
                  <Text className="mt-3 text-[16px] leading-[22px] text-t2">{lines[0]}</Text>
                ) : null}
                <View className="mt-5 flex-row">
                  <Pill
                    title="Details"
                    onPress={() =>
                      router.push({ pathname: '/title/[id]', params: { id: item.id } })
                    }
                  />
                </View>
              </View>
              <View
                className="absolute right-gutter items-center gap-4"
                style={{ bottom: bottom + 28 }}>
                <CircleButton
                  label={isSaved ? 'Remove from list' : 'Save to list'}
                  active={isSaved}
                  onPress={() => toggleSave(item.id)}>
                  <Icon
                    name="bookmark"
                    size={20}
                    color={isSaved ? colors.ink : colors.white}
                    filled={isSaved}
                  />
                </CircleButton>
                <CircleButton
                  icon="play"
                  label="Open player"
                  onPress={() => router.push({ pathname: '/player/[id]', params: { id: item.id } })}
                />
              </View>
            </View>
          );
        }}
      />
      <View
        pointerEvents="none"
        className="absolute left-gutter right-gutter"
        style={{ top: top + 8 }}>
        <View className="h-0.5 overflow-hidden rounded-full bg-white/25">
          <Animated.View style={[{ height: 2, backgroundColor: colors.white }, bar]} />
        </View>
      </View>
      <View className="absolute left-gutter" style={{ top: top + 20 }}>
        <CircleButton
          icon="close"
          label="Close"
          size={44}
          tone="glass"
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}
