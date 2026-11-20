import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Share, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
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
import { ReviewCard } from '@/components/ReviewCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { clipsOf, reviews as seedReviews } from '@/data/extras';
import { getTitle } from '@/data/titles';
import { useTitle } from '@/hooks/useTitle';
import { parseId } from '@/lib/api';
import { heroHeightFor, useClosing, useCloseTitle, useFlying, useOpenTitle } from '@/lib/flight';
import { genreLine, kindLine } from '@/lib/format';
import { springs } from '@/lib/motion';
import { useApp, useIsSaved } from '@/store/store';
import type { Clip, Title } from '@/types';

const LANGUAGES = ['English', 'Hindi', 'Telugu'];

export default function TitleDetail() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const closeTitle = useCloseTitle();
  const flying = useFlying();
  const closing = useClosing();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { title, loading } = useTitle(id);
  const toggleSave = useApp((s) => s.toggleSave);
  const progress = useApp((s) => s.watching[id]);
  const language = useApp((s) => s.language);
  const saved = useIsSaved(id);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Was this screen opened by a card flying into it? Decides which entrance to play.
  const withFlight = useRef(flying).current;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
    // Pull the page down past the top and let go to close it
    onEndDrag: (e) => {
      if (e.contentOffset.y < -110) runOnJS(closeTitle)(id, e.contentOffset.y);
    },
  });

  // Dark page background fades in just after the artwork starts moving, and out as it flies home
  const pageBg = useSharedValue(withFlight ? 0 : 1);
  const content = useSharedValue(1);
  useEffect(() => {
    if (withFlight) pageBg.value = withDelay(110, withTiming(1, { duration: 300 }));
  }, [withFlight, pageBg]);
  useEffect(() => {
    if (!closing) return;
    content.value = withTiming(0, { duration: 150, easing: Easing.linear });
    pageBg.value = withDelay(60, withTiming(0, { duration: 320, easing: Easing.linear }));
  }, [closing, content, pageBg]);
  const pageBgStyle = useAnimatedStyle(() => ({ opacity: pageBg.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: content.value }));

  const heroHeight = heroHeightFor(width);
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
  const barTitle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [300, 420], [0, 1], Extrapolation.CLAMP),
  }));
  // Floating bar springs up once the hero buttons have scrolled under the top bar
  const dock = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(scrollY.value > heroHeight - 130 ? 0 : 160, springs.pop) },
    ],
  }));

  if (!title) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <Text className="text-center text-xl font-bold text-white">
          {loading ? 'Loading…' : 'Title not found'}
        </Text>
        <View className="mt-6">
          <Pill title="Go back" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const series = title.kind === 'series';
  const seeded = !parseId(title.id);
  const related = title.related.map((rid) => getTitle(rid)).filter((t): t is Title => !!t);
  const clips: Clip[] = title.clips ?? (seeded ? clipsOf(title) : []);
  const reviews = title.reviews ?? (seeded ? seedReviews : []);
  const firstClip = title.clips?.find((c) => c.key);

  const playTrailer = () => {
    if (firstClip?.key) Linking.openURL(`https://www.youtube.com/watch?v=${firstClip.key}`);
    else router.push({ pathname: '/player/[id]', params: { id: title.id } });
  };
  const playClip = (clip: Clip) => {
    if (clip.key) Linking.openURL(`https://www.youtube.com/watch?v=${clip.key}`);
    else playTrailer();
  };
  const share = () => Share.share({ message: `${title.name} on Motion Box` });

  const label = series ? (progress ? 'Resume S1 · E3' : 'Play S1 · E1') : 'Watch trailer';

  const actions = (
    <View className="flex-row items-center gap-3">
      <CircleButton
        label={saved ? 'Remove from list' : 'Save to list'}
        active={saved}
        onPress={() => toggleSave(title.id)}>
        <Icon name="bookmark" size={20} color={saved ? colors.ink : colors.white} filled={saved} />
      </CircleButton>
      <Pill title={label} icon="play" className="flex-1" onPress={playTrailer} />
      <CircleButton icon="share" label="Share" onPress={share} />
    </View>
  );

  const story = title.story;
  const short =
    story.length > 118 ? `${story.slice(0, Math.max(0, story.lastIndexOf(' ', 118)))}…` : story;

  const about: [string, string][] = (
    [
      ['Released', title.released],
      [series ? 'Creator' : 'Director', title.director],
      [series ? 'Network' : 'Studio', title.studio],
      ['Language', LANGUAGES[language] ?? 'English'],
      ['Genres', title.genres.join(' · ')],
      ['Seasons', series && title.seasons ? String(title.seasons) : ''],
    ] as [string, string][]
  ).filter(([, v]) => !!v);

  const enter = (delay: number, ms: number, down = false) =>
    withFlight ? (down ? FadeInDown : FadeIn).delay(delay).duration(ms) : FadeIn.duration(220);

  return (
    <View style={{ flex: 1 }}>
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
          pageBgStyle,
        ]}
      />
      <Animated.View style={[{ flex: 1 }, contentStyle]}>
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          bounces>
          <View style={{ width: '100%', height: heroHeight, opacity: flying ? 0 : 1 }}>
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
              entering={enter(324, 280)}
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 20,
                  alignItems: 'center',
                  paddingHorizontal: 20,
                },
                heroText,
              ]}>
              <Text className="text-eyebrow font-semibold uppercase text-t2">
                {kindLine(title)}
              </Text>
              <Text
                numberOfLines={2}
                className="mt-2 text-center text-[40px] font-extrabold leading-[42px] tracking-tighter text-white">
                {title.name}
              </Text>
              <View className="mt-3 flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Icon name="star" size={13} />
                  <Text className="text-[13px] font-semibold text-white">
                    {title.score.toFixed(1)}
                  </Text>
                </View>
                {title.runtime ? (
                  <Text className="text-[13px] text-t2">{title.runtime}</Text>
                ) : null}
                {title.rating ? (
                  <View className="rounded border border-white/30 px-1.5 py-0.5">
                    <Text className="text-[11px] font-semibold text-t2">{title.rating}</Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-2 text-[13px] text-t2">{genreLine(title)}</Text>
              <View className="mt-5 w-full">{actions}</View>
            </Animated.View>
          </View>

          <Animated.View entering={enter(300, 480, true)}>
            <Text
              onPress={() => setExpanded((e) => !e)}
              className="px-gutter pt-2 text-[15px] leading-6 text-t2">
              {expanded ? story : short}
              {story.length > 118 ? (
                <Text className="font-bold text-white">{expanded ? '  Less' : '  More'}</Text>
              ) : null}
            </Text>

            {series && seeded ? (
              <Pressable
                accessibilityRole="button"
                scale={0.98}
                onPress={() => setEpisodesOpen(true)}
                className="mx-gutter mt-6 h-14 flex-row items-center justify-between rounded-card bg-s1 px-4">
                <Text className="text-base font-semibold text-white">
                  Episodes · {title.seasons ?? 1}{' '}
                  {(title.seasons ?? 1) === 1 ? 'season' : 'seasons'}
                </Text>
                <Icon name="chevronRight" size={18} color={colors.t3} />
              </Pressable>
            ) : null}

            {loading && !title.detailed ? (
              <View className="gap-3 px-gutter pt-8">
                <Skeleton width={140} height={22} />
                <View className="flex-row gap-3">
                  <Skeleton width={220} height={124} radius={16} />
                  <Skeleton width={220} height={124} radius={16} />
                </View>
              </View>
            ) : null}

            {clips.length ? (
              <>
                <SectionHeader title="Trailers" />
                <Rail
                  data={clips}
                  keyExtractor={(c) => `${c.key ?? c.title}`}
                  renderItem={(c) => (
                    <ClipCard title={title} clip={c} onPress={() => playClip(c)} />
                  )}
                />
              </>
            ) : null}

            {title.cast.length ? (
              <>
                <SectionHeader title="Cast & crew" />
                <Rail
                  data={title.cast}
                  keyExtractor={(c) => c.name}
                  gap={16}
                  renderItem={(c) => (
                    <Pressable
                      accessibilityRole="button"
                      scale={0.95}
                      onPress={() =>
                        router.push({ pathname: '/person/[name]', params: { name: c.name } })
                      }
                      className="items-center"
                      style={{ width: 84 }}>
                      <Avatar name={c.name} size={72} photoPath={c.photoPath} />
                      <Text
                        numberOfLines={1}
                        className="mt-2 text-[12.5px] font-semibold text-white">
                        {c.name}
                      </Text>
                      <Text numberOfLines={1} className="text-[11.5px] text-t3">
                        {c.role}
                      </Text>
                    </Pressable>
                  )}
                />
              </>
            ) : null}

            {reviews.length ? (
              <>
                <SectionHeader title="Reviews" />
                <Rail
                  data={reviews}
                  keyExtractor={(r) => `${r.user}-${r.when}`}
                  renderItem={(r) => (
                    <View style={{ width: 300 }}>
                      <ReviewCard review={r} />
                    </View>
                  )}
                />
              </>
            ) : null}

            {related.length ? (
              <>
                <SectionHeader title="More like this" />
                <Rail
                  data={related}
                  keyExtractor={(t) => t.id}
                  renderItem={(t) => <Poster title={t} showScore onPress={openTitle} />}
                />
              </>
            ) : null}

            <SectionHeader title="About" />
            <View className="mx-gutter overflow-hidden rounded-card bg-s1">
              {about.map(([k, v], i) => (
                <View
                  key={k}
                  className={`flex-row items-start justify-between gap-6 px-4 py-3.5 ${
                    i ? 'border-t border-white/5' : ''
                  }`}>
                  <Text className="text-[14px] text-t3">{k}</Text>
                  <Text className="flex-1 text-right text-[14px] font-semibold text-white">
                    {v}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ height: 130 + bottom }} />
          </Animated.View>
        </Animated.ScrollView>

        {/* Top bar: clear over the hero, ink with the title once scrolled */}
        <Animated.View
          entering={enter(270, 260)}
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 0, right: 0, top: 0, paddingTop: top + 8 }}>
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
              onPress={() => closeTitle(title.id, scrollY.value)}
            />
            <Animated.Text
              numberOfLines={1}
              style={[
                {
                  flex: 1,
                  textAlign: 'center',
                  marginHorizontal: 12,
                  color: colors.white,
                  fontSize: 16,
                  fontWeight: '700',
                },
                barTitle,
              ]}>
              {title.name}
            </Animated.Text>
            <CircleButton icon="more" label="More" size={44} tone="glass" onPress={share} />
          </View>
        </Animated.View>

        {/* Floating bar: save, trailer, share */}
        <Animated.View
          pointerEvents="box-none"
          style={[{ position: 'absolute', left: 20, right: 20, bottom: bottom + 12 }, dock]}>
          <View className="rounded-full bg-s1/95 p-2">{actions}</View>
        </Animated.View>
      </Animated.View>

      {series && seeded ? (
        <EpisodesSheet
          title={title}
          visible={episodesOpen}
          onClose={() => setEpisodesOpen(false)}
        />
      ) : null}
    </View>
  );
}
