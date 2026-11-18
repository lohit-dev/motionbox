import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { getTitle } from '@/data/titles';
import { useApp } from '@/store/store';
import type { LibraryTab, Title } from '@/types';

const TABS: { value: LibraryTab; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

const EMPTY: Record<LibraryTab, string> = {
  saved: 'Nothing saved yet. Tap the bookmark on any title.',
  watching: 'Nothing in progress.',
  watched: 'Finished titles show up here.',
};

const COLUMNS = 3;
const GAP = 12;

export default function Library() {
  const router = useRouter();
  const { libraryTab, setLibraryTab, saved, watching, watched } = useApp();

  const ids =
    libraryTab === 'saved' ? saved : libraryTab === 'watching' ? Object.keys(watching) : watched;
  const data = ids.map((id) => getTitle(id)).filter((t): t is Title => !!t);
  const open = (t: Title) => router.push({ pathname: '/title/[id]', params: { id: t.id } });

  return (
    <View className="flex-1">
      <ScreenHeader title="Library" />
      <UnderlineTabs tabs={TABS} value={libraryTab} onChange={setLibraryTab} />
      <FlatList
        // a new key remounts the grid so the entrance replays on tab change
        key={libraryTab}
        data={data}
        numColumns={COLUMNS}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: GAP }}
        columnWrapperStyle={{ gap: GAP }}
        ListEmptyComponent={
          <Text className="mt-16 px-8 text-center text-[14.5px] leading-5 text-t2">
            {EMPTY[libraryTab]}
          </Text>
        }
        renderItem={({ item, index }) => (
          <Reveal index={index} style={{ flex: 1 / COLUMNS }}>
            <Poster
              title={item}
              width={106}
              subtitle={libraryTab === 'watching' ? `${watching[item.id]}% watched` : undefined}
              onPress={open}
            />
          </Reveal>
        )}
      />
    </View>
  );
}
