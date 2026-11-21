import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
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
import { Pressable } from '@/components/ui/Pressable';
import { useHome } from '@/hooks/useHome';
import { useTitle, useTitles } from '@/hooks/useTitle';
import { useUpdates } from '@/hooks/useUpdates';
import { useOpenTitle } from '@/lib/flight';
import { openTrailer } from '@/lib/trailer';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

const key = (t: Title) => t.id;
const renderRing = (t: Title) => <Ring title={t} onPress={playTrailer} />;
const playTrailer = (t: Title) => {
  openTrailer(t);
};
const EYEBROWS = ['No. 1 this week', 'Trending now', 'Trending now', 'Popular this week'];

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

  const [reload, setReload] = useState(0);
  const home = useHome(reload);
  const updates = useUpdates();

  const slides = useMemo(
    () =>
      home.trending
        .slice(0, 4)
        .map((title, i) => ({ title, eyebrow: EYEBROWS[i] ?? 'Trending now' })),
    [home.trending]
  );
  const rings = useMemo(() => home.trending.slice(0, 8), [home.trending]);
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
  const renderUpcoming = useCallback(
    (t: Title) => <Poster title={t} date={t.released.slice(0, 6)} onPress={openTitle} />,
    [openTitle]
  );
  const unread = !updatesRead && updates.count > 0;

  return (
    <View className="flex-1 bg-ink">
      {!home.configured ? (
        <NeedsKey />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
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
                onToggleSave={toggleSave}
                onOpen={openTitle}
                onTrailer={playTrailer}
              />

              <View className="pt-6">
                <Rail data={rings} keyExtractor={key} gap={8} renderItem={renderRing} />
              </View>

              {resume.length ? (
                <>
                  <SectionHeader title="Continue watching" />
                  <Rail data={resume} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}

              {topTen.length ? (
                <>
                  <SectionHeader title="Top 10 this week" />
                  <Rail data={topTen} keyExtractor={key} gap={4} renderItem={renderTop} />
                </>
              ) : null}

              {lastSaved && becauseSaved.length ? (
                <>
                  <SectionHeader title={`Because you saved ${lastSaved.name}`} />
                  <Rail data={becauseSaved} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}

              {home.upcoming.length ? (
                <>
                  <SectionHeader title="Coming soon" />
                  <Rail data={home.upcoming} keyExtractor={key} renderItem={renderUpcoming} />
                </>
              ) : null}

              {home.series.length ? (
                <>
                  <SectionHeader title="Popular series" />
                  <Rail data={home.series} keyExtractor={key} renderItem={renderPoster} />
                </>
              ) : null}
              <View className="h-10" />
            </>
          )}
        </ScrollView>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            scale={0.92}
            onPress={() => router.push('/profile')}
            className="h-[42px] w-[42px] items-center justify-center rounded-full bg-black/55">
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={8} r={4} stroke="#fff" strokeWidth={2} />
              <Path
                d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
