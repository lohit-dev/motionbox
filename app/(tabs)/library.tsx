import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { ActionSheet } from '@/components/ActionSheet';
import { EmptyState } from '@/components/EmptyState';
import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/Skeleton';
import { useTitles } from '@/hooks/useTitle';
import { useOpenTitle } from '@/lib/flight';
import { useApp } from '@/store/store';
import type { LibraryTab, Title } from '@/types';

const TABS: { value: LibraryTab; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

const EMPTY: Record<LibraryTab, [string, string]> = {
  saved: ['Nothing saved yet', 'Tap the bookmark on any title to keep it here.'],
  watching: ['Nothing in progress', 'Mark a title as watching from its ⋯ menu and it will wait for you here.'],
  watched: ['Nothing watched yet', 'Mark a title as watched from its ⋯ menu and it shows up here.'],
};

type Sort = 'recent' | 'az' | 'rating';
const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'az', label: 'A – Z' },
  { value: 'rating', label: 'Top rated' },
];

const COLUMNS = 3;
const GAP = 12;

export default function Library() {
  const router = useRouter();
  const open = useOpenTitle();
  const { libraryTab, setLibraryTab, saved, watching, watched } = useApp();
  const toggleSave = useApp((s) => s.toggleSave);
  const toggleWatching = useApp((s) => s.toggleWatching);
  const unmarkWatched = useApp((s) => s.unmarkWatched);
  const [editing, setEditing] = useState(false);
  const [sort, setSort] = useState<Sort>('recent');
  const [sortOpen, setSortOpen] = useState(false);

  const ids = libraryTab === 'saved' ? saved : libraryTab === 'watching' ? watching : watched;
  const { titles, loading } = useTitles(ids);

  const data = useMemo(() => {
    if (sort === 'az') return [...titles].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'rating') return [...titles].sort((a, b) => b.score - a.score);
    return titles;
  }, [titles, sort]);

  const remove = (t: Title) => {
    if (libraryTab === 'saved') toggleSave(t.id);
    else if (libraryTab === 'watching') toggleWatching(t.id);
    else unmarkWatched(t.id);
  };

  return (
    <View className="flex-1">
      <ScreenHeader
        title="Library"
        right={
          <View className="flex-row items-center gap-5">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort"
              scale={0.9}
              onPress={() => setSortOpen(true)}>
              <Icon name="sort" size={20} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              scale={0.94}
              onPress={() => setEditing((e) => !e)}>
              <Text className="text-[15px] font-semibold text-white">
                {editing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>
        }
      />
      <UnderlineTabs tabs={TABS} value={libraryTab} onChange={setLibraryTab} />
      <FlatList
        // a new key remounts the grid so the entrance replays on tab change
        key={`${libraryTab}-${sort}`}
        data={data}
        numColumns={COLUMNS}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, gap: GAP }}
        columnWrapperStyle={{ gap: GAP }}
        ListEmptyComponent={
          loading ? (
            <View className="flex-row gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width={106} height={159} radius={14} />
              ))}
            </View>
          ) : (
          <EmptyState
            title={EMPTY[libraryTab][0]}
            body={EMPTY[libraryTab][1]}
            action="Browse trending"
            onAction={() => router.navigate('/search')}
          />
          )
        }
        renderItem={({ item, index }) => (
          <Reveal index={index} style={{ flex: 1 / COLUMNS }}>
            <View>
              <Poster
                title={item}
                width={106}
                onPress={editing ? () => remove(item) : open}
              />
              {editing ? (
                <View
                  pointerEvents="none"
                  className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-black/70">
                  <Icon name="close" size={13} />
                </View>
              ) : null}
            </View>
          </Reveal>
        )}
      />
      <ActionSheet
        visible={sortOpen}
        title="Sort by"
        onClose={() => setSortOpen(false)}
        rows={SORTS.map((s) => ({
          label: s.label,
          icon: sort === s.value ? 'check' : undefined,
          onPress: () => setSort(s.value),
        }))}
      />
    </View>
  );
}
