import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { SectionHeader } from '@/components/SectionHeader';
import { Wordmark } from '@/components/Wordmark';
import { getTitle, titles } from '@/data/titles';
import { useApp } from '@/store/store';
import type { Title } from '@/types';

export default function Home() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const saved = useApp((s) => s.saved);

  const open = (t: Title) => router.push({ pathname: '/title/[id]', params: { id: t.id } });
  const key = (t: Title) => t.id;

  const topTen = [...titles].sort((a, b) => a.popularity - b.popularity);
  const becauseSaved = (getTitle('wolf')?.related ?? [])
    .map((id) => getTitle(id))
    .filter((t): t is Title => !!t);
  const mySaved = saved.map((id) => getTitle(id)).filter((t): t is Title => !!t);
  const comingSoon = titles.filter((t) => t.kind === 'movie');
  const series = titles.filter((t) => t.kind === 'series');

  return (
    <ScrollView contentInsetAdjustmentBehavior="never" showsVerticalScrollIndicator={false}>
      <View className="px-gutter pb-2" style={{ paddingTop: top + 12 }}>
        <Wordmark />
      </View>

      <SectionHeader title="Top 10 this week" onAction={() => {}} />
      <Rail
        data={topTen}
        keyExtractor={key}
        renderItem={(t) => <Poster title={t} width={120} showScore onPress={open} />}
      />

      <SectionHeader title="Because you saved Wolf" onAction={() => {}} />
      <Rail
        data={becauseSaved}
        keyExtractor={key}
        renderItem={(t) => <Poster title={t} tag="NEW" onPress={open} />}
      />

      <SectionHeader title="Coming soon" onAction={() => {}} />
      <Rail
        data={comingSoon}
        keyExtractor={key}
        renderItem={(t) => <Poster title={t} date={t.released.slice(0, 6)} onPress={open} />}
      />

      <SectionHeader title="Popular series" onAction={() => {}} />
      <Rail
        data={series}
        keyExtractor={key}
        renderItem={(t) => <Poster title={t} onPress={open} />}
      />

      {mySaved.length ? (
        <>
          <SectionHeader title="Your list" onAction={() => {}} />
          <Rail
            data={mySaved}
            keyExtractor={key}
            renderItem={(t) => <Poster title={t} onPress={open} />}
          />
        </>
      ) : null}
      <View className="h-10" />
    </ScrollView>
  );
}
