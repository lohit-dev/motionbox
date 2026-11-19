import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Avatar } from '@/components/Avatar';
import { ClipCard } from '@/components/ClipCard';
import { EpisodesSheet } from '@/components/EpisodesSheet';
import { Fade } from '@/components/Fade';
import { Poster } from '@/components/Poster';
import { PosterArt } from '@/components/PosterArt';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { ReviewCard } from '@/components/ReviewCard';
import { SectionHeader } from '@/components/SectionHeader';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { clipsOf, reviews } from '@/data/extras';
import { getTitle } from '@/data/titles';
import { heroHeightFor, useCloseTitle, useFlying, useOpenTitle } from '@/lib/flight';
import { kindLine } from '@/lib/format';
import { springs } from '@/lib/motion';
import { useApp, useIsSaved } from '@/store/store';
import type { Title } from '@/types';

export default function TitleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const closeTitle = useCloseTitle();
  const flying = useFlying();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const toggleSave = useApp((s) => s.toggleSave);
  const saved = useIsSaved(id ?? '');
  const title = getTitle(id ?? '');
  const [episodesOpen, setEpisodesOpen] = useState(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
    // Pull the page down past the top and let go to close it, like the Apple TV app
    onEndDrag: (e) => {
      if (e.contentOffset.y < -110) runOnJS(closeTitle)(id ?? '');
    },
  });

  const heroHeight = heroHeightFor(width);
  // Overscroll stretches the artwork instead of showing a gap
  const heroStretch = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-220, 0], [-110, 0], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-220, 0], [1.4, 1], Extrapolation.CLAMP) },
    ],
  }));
  const heroText = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, heroHeight * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, heroHeight],
          [0, heroHeight * 0.4],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));
  const barBg = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [heroHeight - 140, heroHeight - 80],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));
  // Floating bar slides up once the hero buttons have scrolled away
  const dock = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(scrollY.value > 320 ? 0 : 140, springs.pop) }],
  }));

  if (!title) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <Text className="text-center text-xl font-bold text-white">Title not found</Text>
        <View className="mt-6">
          <Pill title="Go back" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const related = title.related.map((rid) => getTitle(rid)).filter((t): t is Title => !!t);
  const playTrailer = () => router.push({ pathname: '/player/[id]', params: { id: title.id } });
  const share = () => Share.share({ message: `${title.name} on Motion Box` });

  const actions = (
    <View className="flex-row items-center gap-3">
      <CircleButton
        label={saved ? 'Remove from list' : 'Save to list'}
        active={saved}
        onPress={() => toggleSave(title.id)}>
        <Icon name="bookmark" size={20} color={saved ? colors.ink : colors.white} filled={saved} />
      </CircleButton>
      <Pill title="Watch trailer" icon="play" className="flex-1" onPress={playTrailer} />
      <CircleButton icon="share" label="Share" onPress={share} />
    </View>
  );

  return (
    <View className="flex-1 bg-ink">
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        bounces>
        <View style={{ width, height: heroHeight, opacity: flying ? 0 : 1 }}>
          <Animated.View style={heroStretch}>
            <PosterArt
              title={title}
              width={width}
              height={heroHeight}
              radius={0}
              size="w780"
              bordered={false}
            />
          </Animated.View>
          <Fade />
          <Animated.View
            style={[
              { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
              heroText,
            ]}>
            <Reveal style={{ alignItems: 'center' }}>
              <Text className="text-eyebrow font-semibold uppercase text-t2">
                {kindLine(title)}
              </Text>
              <Text className="mt-2 px-gutter text-center text-[40px] font-extrabold leading-[42px] tracking-tighter text-white">
                {title.name}
              </Text>
              <View className="mt-3 flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Icon name="star" size={13} />
                  <Text className="text-[13px] font-semibold text-white">
                    {title.score.toFixed(1)}
                  </Text>
                </View>
                <Text className="text-[13px] text-t2">{title.runtime}</Text>
                <View className="rounded border border-white/30 px-1.5 py-0.5">
                  <Text className="text-[11px] font-semibold text-t2">{title.rating}</Text>
                </View>
              </View>
            </Reveal>
          </Animated.View>
        </View>

        <Reveal index={2} style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          {actions}
          <Text className="mt-5 text-[15px] leading-6 text-t2">{title.story}</Text>
          <View className="mt-5 flex-row flex-wrap gap-x-8 gap-y-3">
            {[
              ['Released', title.released],
              ['Director', title.director],
              ['Studio', title.studio],
              ['Genres', title.genres.join(' · ')],
            ].map(([k, v]) => (
              <View key={k}>
                <Text className="text-eyebrow font-semibold uppercase text-t3">{k}</Text>
                <Text className="mt-1 text-[14px] text-white">{v}</Text>
              </View>
            ))}
          </View>
          {title.kind === 'series' ? (
            <Pressable
              accessibilityRole="button"
              scale={0.98}
              onPress={() => setEpisodesOpen(true)}
              className="mt-6 h-14 flex-row items-center justify-between rounded-card bg-s1 px-4">
              <Text className="text-base font-semibold text-white">
                Episodes · {title.seasons} {title.seasons === 1 ? 'season' : 'seasons'}
              </Text>
              <Icon name="chevronRight" size={18} color={colors.t3} />
            </Pressable>
          ) : null}
        </Reveal>

        <SectionHeader title="Trailers & clips" />
        <Rail
          data={clipsOf(title)}
          keyExtractor={(c) => c.title}
          renderItem={(c) => <ClipCard title={title} clip={c} onPress={playTrailer} />}
        />

        <SectionHeader title="Cast" />
        <Rail
          data={title.cast}
          keyExtractor={(c) => c.name}
          gap={16}
          renderItem={(c) => (
            <Pressable
              accessibilityRole="button"
              scale={0.95}
              onPress={() => router.push({ pathname: '/person/[name]', params: { name: c.name } })}
              className="items-center"
              style={{ width: 84 }}>
              <Avatar name={c.name} size={72} />
              <Text numberOfLines={1} className="mt-2 text-[12.5px] font-semibold text-white">
                {c.name}
              </Text>
              <Text className="text-[11.5px] text-t3">{c.role}</Text>
            </Pressable>
          )}
        />

        <SectionHeader title="Reviews" action="Write one" onAction={() => {}} />
        <View className="gap-3 px-gutter">
          {reviews.map((r) => (
            <ReviewCard key={r.user} review={r} />
          ))}
        </View>

        <SectionHeader title="More like this" />
        <Rail
          data={related}
          keyExtractor={(t) => t.id}
          renderItem={(t) => <Poster title={t} showScore onPress={openTitle} />}
        />
        <View style={{ height: 120 + bottom }} />
      </Animated.ScrollView>

      {/* Top bar: transparent over the hero, ink once it has scrolled away */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0"
        style={{ paddingTop: top + 8 }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: colors.ink,
            },
            barBg,
          ]}
        />
        <View className="flex-row items-center justify-between px-gutter pb-2">
          <CircleButton
            icon="back"
            label="Back"
            size={44}
            tone="glass"
            onPress={() => closeTitle(title.id)}
          />
          <CircleButton icon="more" label="More" size={44} tone="glass" />
        </View>
      </View>

      {/* Floating bar: save, trailer, share */}
      <Animated.View
        pointerEvents="box-none"
        style={[{ position: 'absolute', left: 20, right: 20, bottom: bottom + 12 }, dock]}>
        <View className="rounded-full bg-s1/95 p-2">{actions}</View>
      </Animated.View>

      {title.kind === 'series' ? (
        <EpisodesSheet
          title={title}
          visible={episodesOpen}
          onClose={() => setEpisodesOpen(false)}
        />
      ) : null}
    </View>
  );
}
