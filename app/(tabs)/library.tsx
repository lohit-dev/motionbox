import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import { Text } from '@/components/ui/Text';
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
import type { LibraryTab } from '@/types';

const TABS: { value: LibraryTab; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'watching', label: 'Watching' },
  { value: 'watched', label: 'Watched' },
];

const EMPTY: Record<LibraryTab, [string, string]> = {
  saved: ['Nothing saved yet', 'Tap the bookmark on any title to keep it here.'],
  watching: [
    'Nothing in progress',
    'Mark a title as watching from its ⋯ menu and it will wait for you here.',
  ],
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

const REMOVE = {
  saved: (s: ReturnType<typeof useApp.getState>) => s.toggleSave,
  watching: (s: ReturnType<typeof useApp.getState>) => s.toggleWatching,
  watched: (s: ReturnType<typeof useApp.getState>) => s.unmarkWatched,
};

interface PageProps {
  tab: LibraryTab;
  sort: Sort;
  editing: boolean;
  width: number;
}

/** One tab's grid. Each page keeps its own scroll position while swiping between tabs. */
function Page({ tab, sort, editing, width }: PageProps) {
  const router = useRouter();
  const open = useOpenTitle();
  const ids = useApp((s) =>
    tab === 'saved' ? s.saved : tab === 'watching' ? s.watching : s.watched
  );
  const remove = useApp(REMOVE[tab]);
  const { titles, loading } = useTitles(ids);

  const data = useMemo(() => {
    if (sort === 'az') return [...titles].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'rating') return [...titles].sort((a, b) => b.score - a.score);
    return titles;
  }, [titles, sort]);

  const poster = (width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={{ width }}>
      <FlatList
        data={data}
        numColumns={COLUMNS}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: GAP }}
        columnWrapperStyle={{ gap: GAP }}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          loading ? (
            <View className="flex-row" style={{ gap: GAP }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width={poster} height={poster * 1.5} radius={14} />
              ))}
            </View>
          ) : (
            <EmptyState
              title={EMPTY[tab][0]}
              body={EMPTY[tab][1]}
              action="Browse trending"
              onAction={() => router.navigate('/search')}
            />
          )
        }
        renderItem={({ item, index }) => (
          <Reveal index={index % 9} style={{ flex: 1 / COLUMNS }}>
            <View>
              <Poster
                title={item}
                width={poster}
                onPress={editing ? () => remove(item.id) : open}
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
    </View>
  );
}

export default function Library() {
  const { width } = useWindowDimensions();
  const libraryTab = useApp((s) => s.libraryTab);
  const setLibraryTab = useApp((s) => s.setLibraryTab);
  const [editing, setEditing] = useState(false);
  const [sort, setSort] = useState<Sort>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const pager = useRef<ScrollViewInstance>(null);
  const page = useRef(TABS.findIndex((t) => t.value === libraryTab));

  const goTo = useCallback(
    (tab: LibraryTab) => {
      const i = TABS.findIndex((t) => t.value === tab);
      page.current = i;
      setLibraryTab(tab);
      pager.current?.scrollTo({ x: i * width, animated: true });
    },
    [setLibraryTab, width]
  );

  // Land on the remembered tab without animating
  useEffect(() => {
    pager.current?.scrollTo({ x: page.current * width, animated: false });
  }, [width]);

  // Tabs follow the finger: switch as soon as the swipe passes halfway
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(
      0,
      Math.min(TABS.length - 1, Math.round(e.nativeEvent.contentOffset.x / width))
    );
    if (i !== page.current) {
      page.current = i;
      setLibraryTab(TABS[i].value);
    }
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
              <Text className="text-[15px] text-white font-semibold">
                {editing ? 'Done' : 'Edit'}
              </Text>
            </Pressable>
          </View>
        }
      />
      <UnderlineTabs tabs={TABS} value={libraryTab} onChange={goTo} />
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}
        style={{ flex: 1 }}>
        {TABS.map((t) => (
          <Page key={t.value} tab={t.value} sort={sort} editing={editing} width={width} />
        ))}
      </ScrollView>
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
