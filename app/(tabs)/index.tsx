import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { HeroCarousel } from '@/components/HeroCarousel';
import { NeedsKey } from '@/components/NeedsKey';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { Ring } from '@/components/Ring';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Top10Card } from '@/components/Top10Card';
import { Wordmark } from '@/components/Wordmark';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { useHome } from '@/hooks/useHome';
import { useTitle, useTitles } from '@/hooks/useTitle';
import { useUpdates } from '@/hooks/useUpdates';
import type { FeedKind } from '@/lib/api';
import { useOpenTitle } from '@/lib/flight';
import { openTrailer } from '@/lib/trailer';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

const key = (t: Title) => t.id;
const playTrailer = (t: Title) => {
  openTrailer(t);
};
export default function Home() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const openTitle = useOpenTitle();
  // Only the newest save is read here. Each hero slide watches its own saved flag, so saving
  // a title re-renders that button and nothing else.
  const lastSavedId = useApp((s) => s.saved[0] ?? '');
  const watching = useApp((s) => s.watching);
  const updatesRead = useApp((s) => s.updatesRead);
  const toggleSave = useApp((s) => s.toggleSave);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const [reload, setReload] = useState(0);
  const home = useHome(reload);
  const updates = useUpdates();

  const slides = useMemo(
    () => home.trending.slice(0, 4).map((title) => ({ title })),
    [home.trending]
  );
  // Fresh trailers come from what's in cinemas now, and never repeat a hero slide
  const rings = useMemo(() => {
    const inHero = new Set(slides.map((s) => s.title.id));
    return home.fresh.filter((t) => !inHero.has(t.id)).slice(0, 10);
  }, [home.fresh, slides]);
  const topTen = useMemo(() => home.trending.slice(0, 10), [home.trending]);
  const { titles: resume } = useTitles(watching);

  // The most recent save, with its own detail so its related titles can be listed
  const { title: lastSaved } = useTitle(lastSavedId);
  const { titles: becauseSaved } = useTitles(lastSaved?.related ?? []);

  const renderTop = useCallback(
    (t: Title, i: number) => <Top10Card rank={i + 1} title={t} onPress={openTitle} />,
    [openTitle]
  );
  const renderPoster = useCallback(
    (t: Title) => <Poster title={t} onPress={openTitle} />,
    [openTitle]
  );
  // A ring opens the trailer shorts at that title, with every ring after it a swipe away
  const renderRing = useCallback(
    (t: Title, i: number) => (
      <Ring
        title={t}
        onPress={() =>
          router.push({
            pathname: '/shorts',
            params: { ids: rings.map((r) => r.id).join(','), start: String(i) },
          })
        }
      />
    ),
    [rings, router]
  );
  const renderUpcoming = useCallback(
    (t: Title) => <Poster title={t} date={t.released.slice(0, 6)} onPress={openTitle} />,
    [openTitle]
  );
  const unread = !updatesRead && updates.count > 0;

  // "See all" opens the row as a grid. The ids go in the route, the titles are already cached.
  // Rows that come from TMDB also carry a `feed`, so the grid can keep loading more pages.
  const seeAll = (
    title: string,
    titles: Title[],
    opts: { dates?: boolean; feed?: FeedKind } = {}
  ) =>
    router.push({
      pathname: '/all',
      params: {
        title,
        ids: titles.map((t) => t.id).join(','),
        ...(opts.dates ? { dates: '1' } : {}),
        ...(opts.feed ? { feed: opts.feed } : {}),
      },
    });

  return (
    <View className="flex-1 bg-ink">
      {!home.configured ? (
        <NeedsKey />
      ) : (
        // Pulling past the top stretches the hero (see HeroCarousel) instead of opening a gap
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          overScrollMode="never">
          {home.loading ? (
            <View style={{ paddingTop: top + 60 }}>
              <Skeleton height={420} radius={0} />
              <Skeleton width={150} height={22} style={{ marginHorizontal: 20, marginTop: 32 }} />
              <View className="mt-3.5 flex-row gap-3 px-gutter">
                <Skeleton width={236} height={133} radius={18} />
                <Skeleton width={236} height={133} radius={18} />
              </View>
            </View>
          ) : home.failed ? (
            <View style={{ paddingTop: top + 80 }}>
              <OfflineBanner onRetry={() => setReload((n) => n + 1)} />
            </View>
          ) : (
            <>
              <HeroCarousel
                slides={slides}
                scrollY={scrollY}
                onToggleSave={toggleSave}
                onOpen={openTitle}
                onTrailer={playTrailer}
              />

              {rings.length ? (
                <>
                  <SectionHeader
                    title="Fresh trailers"
                    onAction={() => seeAll('Fresh trailers', home.fresh, { feed: 'fresh' })}
                  />
                  <Rail data={rings} keyExtractor={key} gap={8} renderItem={renderRing} />
                </>
              ) : null}

              {resume.length ? (
                <>
                  <SectionHeader
                    title="Continue watching"
                    onAction={() => seeAll('Continue watching', resume)}
                  />
                  <Rail data={resume} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}

              {topTen.length ? (
                <>
                  <SectionHeader
                    title="Top 10 this week"
                    onAction={() => seeAll('Top 10 this week', topTen, { feed: 'trending' })}
                  />
                  <Rail data={topTen} keyExtractor={key} gap={4} renderItem={renderTop} />
                </>
              ) : null}

              {lastSaved && becauseSaved.length ? (
                <>
                  <SectionHeader
                    title={`Because you saved ${lastSaved.name}`}
                    onAction={() => seeAll(`Because you saved ${lastSaved.name}`, becauseSaved)}
                  />
                  <Rail data={becauseSaved} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}

              {home.upcoming.length ? (
                <>
                  <SectionHeader
                    title="Coming soon"
                    onAction={() =>
                      seeAll('Coming soon', home.upcoming, { dates: true, feed: 'upcoming' })
                    }
                  />
                  <Rail data={home.upcoming} keyExtractor={key} renderItem={renderUpcoming} />
                </>
              ) : null}

              {home.rated.length ? (
                <>
                  <SectionHeader
                    title="Top rated"
                    onAction={() => seeAll('Top rated', home.rated, { feed: 'rated' })}
                  />
                  <Rail data={home.rated} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}

              {home.series.length ? (
                <>
                  <SectionHeader
                    title="Popular series"
                    onAction={() => seeAll('Popular series', home.series, { feed: 'series' })}
                  />
                  <Rail data={home.series} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}
              <View className="h-10" />
            </>
          )}
        </Animated.ScrollView>
      )}

      {/* Header floats over the hero */}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 flex-row items-center justify-between px-gutter"
        style={{ top: top + 8 }}>
        <Wordmark size={28} />
        <View className="flex-row items-center gap-2.5">
          <CircleButton
            label="Updates"
            size={42}
            tone="glass"
            onPress={() => router.push('/updates')}>
            <Icon name="bell" size={19} />
            {unread ? (
              <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-white" />
            ) : null}
          </CircleButton>
          <CircleButton
            label="Profile"
            size={42}
            tone="glass"
            onPress={() => router.push('/profile')}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={8} r={4} stroke="#fff" strokeWidth={2} />
              <Path
                d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </CircleButton>
        </View>
      </View>
    </View>
  );
}
