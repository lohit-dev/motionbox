import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/ActionSheet';
import { ContinueCard } from '@/components/ContinueCard';
import { HeroCarousel } from '@/components/HeroCarousel';
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
import { heroSlides, ringIds, updates } from '@/data/extras';
import { getTitle, titles } from '@/data/titles';
import { useOpenTitle } from '@/lib/flight';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

const key = (t: Title) => t.id;
const known = (ids: string[]) => ids.map((id) => getTitle(id)).filter((t): t is Title => !!t);

export default function Home() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const openTitle = useOpenTitle();
  const {
    saved,
    watching,
    hiddenContinue,
    offline,
    updatesRead,
    toggleSave,
    hideContinue,
    markWatched,
    setOffline,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [optionsFor, setOptionsFor] = useState<Title | null>(null);
  const [seen, setSeen] = useState<string[]>(['wolf', 'silent']);

  // Stand-in for the first network load, so the skeleton state is part of the app.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const slides = useMemo(
    () =>
      heroSlides.flatMap((s) =>
        getTitle(s.id) ? [{ title: getTitle(s.id)!, eyebrow: s.eyebrow }] : []
      ),
    []
  );
  const rings = known(ringIds);
  const resume = known(Object.keys(watching).filter((id) => !hiddenContinue.includes(id)));
  const topTen = [...titles].sort((a, b) => a.popularity - b.popularity);
  const becauseSaved = known(getTitle('wolf')?.related ?? []);
  const comingSoon = titles.filter((t) => t.kind === 'movie');
  const series = titles.filter((t) => t.kind === 'series');
  const unread = !updatesRead && updates.some((u) => u.unread);

  const trailer = (t: Title) => router.push({ pathname: '/player/[id]', params: { id: t.id } });

  return (
    <View className="flex-1 bg-ink">
      <ScrollView showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never">
        {loading ? (
          <View style={{ paddingTop: top + 60 }}>
            <Skeleton height={420} radius={0} />
            <Skeleton width={150} height={22} style={{ marginHorizontal: 20, marginTop: 32 }} />
            <View className="mt-3.5 flex-row gap-3 px-gutter">
              <Skeleton width={236} height={133} radius={18} />
              <Skeleton width={236} height={133} radius={18} />
            </View>
          </View>
        ) : (
          <>
            {offline ? (
              <View style={{ paddingTop: top + 60 }}>
                <OfflineBanner onRetry={() => setOffline(false)} />
              </View>
            ) : null}
            <HeroCarousel
              slides={slides}
              saved={(id) => saved.includes(id)}
              onToggleSave={toggleSave}
              onOpen={(t, art) => openTitle(t, art, 0)}
              onTrailer={trailer}
            />

            <View className="pt-6">
              <Rail
                data={rings}
                keyExtractor={key}
                gap={8}
                renderItem={(t) => (
                  <Ring
                    title={t}
                    seen={seen.includes(t.id)}
                    onPress={(next) => {
                      setSeen((s) => [...s, next.id]);
                      router.push('/trailers');
                    }}
                  />
                )}
              />
            </View>

            {resume.length ? (
              <>
                <SectionHeader title="Continue watching" />
                <Rail
                  data={resume}
                  keyExtractor={key}
                  renderItem={(t) => (
                    <ContinueCard
                      title={t}
                      percent={watching[t.id] ?? 0}
                      onPress={trailer}
                      onLongPress={setOptionsFor}
                    />
                  )}
                />
              </>
            ) : null}

            <SectionHeader title="Top 10 this week" />
            <Rail
              data={topTen.slice(0, 10)}
              keyExtractor={key}
              gap={4}
              renderItem={(t, i) => <Top10Card rank={i + 1} title={t} onPress={openTitle} />}
            />

            <SectionHeader title="Because you saved Wolf" />
            <Rail
              data={becauseSaved}
              keyExtractor={key}
              renderItem={(t) => <Poster title={t} tag="NEW" onPress={openTitle} />}
            />

            <SectionHeader title="Coming soon" />
            <Rail
              data={comingSoon}
              keyExtractor={key}
              renderItem={(t) => (
                <Poster title={t} date={t.released.slice(0, 6)} onPress={openTitle} />
              )}
            />

            <SectionHeader title="Popular series" />
            <Rail
              data={series}
              keyExtractor={key}
              renderItem={(t) => <Poster title={t} onPress={openTitle} />}
            />
            <View className="h-10" />
          </>
        )}
      </ScrollView>

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
            <Text className="text-[15px] font-bold text-white">K</Text>
          </Pressable>
        </View>
      </View>

      <ActionSheet
        visible={!!optionsFor}
        title={optionsFor?.name}
        onClose={() => setOptionsFor(null)}
        rows={
          optionsFor
            ? [
                {
                  label: 'Mark as watched',
                  icon: 'check',
                  onPress: () => markWatched(optionsFor.id),
                },
                {
                  label: 'Remove from Continue Watching',
                  icon: 'close',
                  destructive: true,
                  onPress: () => hideContinue(optionsFor.id),
                },
              ]
            : []
        }
      />
    </View>
  );
}
