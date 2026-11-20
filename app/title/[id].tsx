import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { ActionSheet } from '@/components/ActionSheet';
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
import { TitleLogo } from '@/components/TitleLogo';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { useTitle, useTitles } from '@/hooks/useTitle';
import { parseId } from '@/lib/api';
import {
  heroHeightFor,
  useCloseTitle,
  useClosing,
  useFlightProgress,
  useFlying,
  useHeroReady,
  useOpenTitle,
} from '@/lib/flight';
import { genreLine, kindLine } from '@/lib/format';
import { springs } from '@/lib/motion';
import { getTitle } from '@/lib/titles';
import { openClip, openTrailer } from '@/lib/trailer';
import { warmUpYouTube } from '@/lib/youtube';
import { useApp, useIsSaved } from '@/store/store';
import type { Clip } from '@/types';

export default function TitleDetail() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const closeTitle = useCloseTitle();
  const flying = useFlying();
  const progress = useFlightProgress();
  const heroReady = useHeroReady();
  const closing = useClosing(id);
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const { title, loading, failed } = useTitle(id);
  const toggleSave = useApp((s) => s.toggleSave);
  const watching = useApp((s) => s.watching.includes(id));
  const watched = useApp((s) => s.watched.includes(id));
  const toggleWatching = useApp((s) => s.toggleWatching);
  const markWatched = useApp((s) => s.markWatched);
  const unmarkWatched = useApp((s) => s.unmarkWatched);
  const saved = useIsSaved(id);
  const { titles: related } = useTitles(title?.related ?? []);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [noTrailer, setNoTrailer] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Was this screen opened by a card flying into it? Decides which entrance to play.
  const [withFlight] = useState(flying);
  const [ready, setReady] = useState(!withFlight);
  // Resolve YouTube's player script while the person reads the title page.
  useEffect(() => {
    if (title?.clips?.length) warmUpYouTube();
  }, [title?.clips?.length]);
  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setReady(true), 560);
    return () => clearTimeout(t);
  }, [ready]);

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
  const pageBg = useSharedValue(1);
  const content = useSharedValue(1);
  // Tell the flight this hero exists so the flying artwork can hand over to it
  useEffect(() => {
    const frame = requestAnimationFrame(heroReady);
    return () => cancelAnimationFrame(frame);
  }, [heroReady]);
  useEffect(() => {
    if (!closing) return;
    content.value = withTiming(0, { duration: 150, easing: Easing.linear });
    pageBg.value = withDelay(60, withTiming(0, { duration: 320, easing: Easing.linear }));
  }, [closing, content, pageBg]);
  // Follows the artwork's flight on the UI thread, so a slow mount can't leave a black gap
  const pageBgStyle = useAnimatedStyle(() => ({
    opacity:
      pageBg.value *
      (withFlight ? interpolate(progress.value, [0.1, 0.7], [0, 1], Extrapolation.CLAMP) : 1),
  }));
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
  const dockY = useSharedValue(160);
  useAnimatedReaction(
    () => scrollY.value > heroHeight - 130,
    (show, was) => {
      if (show !== was) dockY.value = withSpring(show ? 0 : 160, springs.pop);
    }
  );
  const dock = useAnimatedStyle(() => ({ transform: [{ translateY: dockY.value }] }));

  // The root stack can be entered without a dynamic segment on a fresh native launch.
  // Never leave the user stranded on an empty detail route.
  if (!id || (!parseId(id) && !getTitle(id))) return <Redirect href="/" />;

  if (!title) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <Text className="text-center text-xl font-bold text-white">
          {loading ? 'Loading…' : failed ? 'Could not load this title' : 'Title not found'}
        </Text>
        <View className="mt-6">
          <Pill
            title={router.canGoBack() ? 'Go back' : 'Go to home'}
            tone="ghost"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/');
            }}
          />
        </View>
      </View>
    );
  }

  const series = title.kind === 'series';
  const clips: Clip[] = title.clips ?? [];
  const reviews = title.reviews ?? [];
  const noClips = noTrailer || (!!title.detailed && !clips.some((c) => c.key));

  const playTrailer = async () => {
    if (noClips) return;
    if (!(await openTrailer(title))) setNoTrailer(true);
  };
  const playClip = (clip: Clip) => {
    if (clip.key) openClip(clip.key);
  };
  const share = () => Share.share({ message: `${title.name} on Motion Box` });

  const label = noClips ? 'No trailer yet' : 'Watch trailer';

  const actions = (
    <View className="flex-row items-center gap-3">
      <CircleButton
        label={saved ? 'Remove from list' : 'Save to list'}
        active={saved}
        onPress={() => toggleSave(title.id)}>
        <Icon name="bookmark" size={20} color={saved ? colors.ink : colors.white} filled={saved} />
      </CircleButton>
      <Pill
        title={label}
        icon="play"
        tone={noClips ? 'ghost' : 'primary'}
        className="flex-1"
        onPress={playTrailer}
      />
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
      ['Language', title.language ?? ''],
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
          <View style={{ width: '100%', height: heroHeight }}>
            <Animated.View style={heroStretch}>
              <PosterArt
                title={title}
                textless
                placeholder
                width={width}
                height={heroHeight}
                radius={0}
                size="w1280"
                bordered={false}
              />
            </Animated.View>
            <Fade />
            <Animated.View
              entering={enter(520, 320)}
              pointerEvents="box-none"
              style={{ position: 'absolute', left: 0, right: 0, bottom: 20 }}>
              <Animated.View
                pointerEvents="box-none"
                style={[{ alignItems: 'center', paddingHorizontal: 20 }, heroText]}>
                <Text className="text-eyebrow font-semibold uppercase text-t2">
                  {kindLine(title)}
                </Text>
                <View className="mt-2 items-center">
                  <TitleLogo
                    title={title}
                    maxWidth={Math.min(width * 0.8, 420)}
                    maxHeight={110}
                    fontSize={36}
                  />
                </View>
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

            {series ? (
              <Pressable
                accessibilityRole="button"
                scale={0.98}
                onPress={() => setEpisodesOpen(true)}
                className="mx-gutter mt-6 h-14 flex-row items-center justify-between rounded-card bg-s1 px-4">
                <Text className="text-base font-semibold text-white">
                  Episodes
                  {title.seasons
                    ? ` · ${title.seasons} ${title.seasons === 1 ? 'season' : 'seasons'}`
                    : ''}
                </Text>
                <Icon name="chevronRight" size={18} color={colors.t3} />
              </Pressable>
            ) : null}

            {/* Below-the-fold sections wait for the entrance to finish so the flight stays at 60fps */}
            {ready ? (
              <>
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
                      keyExtractor={(c) => `${c.id}-${c.role}`}
                      gap={16}
                      renderItem={(c) => (
                        <Pressable
                          accessibilityRole="button"
                          scale={0.95}
                          onPress={() =>
                            router.push({ pathname: '/person/[id]', params: { id: String(c.id) } })
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
              </>
            ) : null}
            <View style={{ height: 110 + bottom }} />
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
            <CircleButton
              icon="more"
              label="More"
              size={44}
              tone="glass"
              onPress={() => setMoreOpen(true)}
            />
          </View>
        </Animated.View>

        {/* Floating bar: save, trailer, share */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            { position: 'absolute', left: 20, right: 20, bottom: Math.max(bottom - 14, 10) },
            dock,
          ]}>
          <View className="rounded-full border border-white/10 bg-s2 p-2">{actions}</View>
        </Animated.View>
      </Animated.View>

      {series ? (
        <EpisodesSheet
          title={title}
          visible={episodesOpen}
          onClose={() => setEpisodesOpen(false)}
        />
      ) : null}
      <ActionSheet
        visible={moreOpen}
        title={title.name}
        onClose={() => setMoreOpen(false)}
        rows={[
          {
            label: saved ? 'Remove from list' : 'Save to list',
            icon: 'bookmark',
            onPress: () => toggleSave(title.id),
          },
          {
            label: watching ? 'Stop watching' : 'Mark as watching',
            icon: 'play',
            onPress: () => toggleWatching(title.id),
          },
          {
            label: watched ? 'Remove from watched' : 'Mark as watched',
            icon: 'check',
            onPress: () => (watched ? unmarkWatched(title.id) : markWatched(title.id)),
          },
          { label: 'Share', icon: 'share', onPress: share },
        ]}
      />
    </View>
  );
}
