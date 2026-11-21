import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Image,
  View,
  useWindowDimensions,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Fade } from '@/components/Fade';
import { FilterSheet } from '@/components/FilterSheet';
import { NeedsKey } from '@/components/NeedsKey';
import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { UnderlineTabs } from '@/components/UnderlineTabs';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { useSwipe } from '@/hooks/useSwipe';
import { useGenreCovers } from '@/hooks/useGenreCovers';
import { useHome } from '@/hooks/useHome';
import { useSearch } from '@/hooks/useSearch';
import { GENRES, hasTmdb } from '@/lib/api';
import { useOpenTitle } from '@/lib/flight';
import { imageUrl } from '@/lib/tmdb';
import { useApp } from '@/store/store';
import { NO_FILTERS, type Filters, type Title } from '@/types';

type Tab = 'all' | 'movie' | 'series' | 'people';

const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
  { value: 'people', label: 'People' },
];

const activeCount = (f: Filters) =>
  f.genres.length +
  (f.minScore ? 1 : 0) +
  (f.kind !== 'all' ? 1 : 0) +
  (f.sort !== 'popular' ? 1 : 0);

const COLUMNS = 3;
const GAP = 12;

export default function Search() {
  const router = useRouter();
  const open = useOpenTitle();
  const { width } = useWindowDimensions();
  const recents = useApp((s) => s.recentSearches);
  const addRecent = useApp((s) => s.addRecent);
  const clearRecents = useApp((s) => s.clearRecents);
  const home = useHome();

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [people, setPeople] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const text = query.trim();
  const filtering = activeCount(filters) > 0;
  const showResults = text.length >= 2 || filtering;
  const search = useSearch(query, filters, showResults);
  const poster = (width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;
  const tile = (width - 40 - 12) / 2;

  const covers = useGenreCovers();

  const tab: Tab = people
    ? 'people'
    : filters.kind === 'movie'
      ? 'movie'
      : filters.kind === 'series'
        ? 'series'
        : 'all';
  const pickTab = (next: Tab) => {
    setPeople(next === 'people');
    if (next !== 'people') setFilters({ ...filters, kind: next === 'all' ? 'all' : next });
  };
  // Swipe sideways over the results to move between All, Movies, Series and People
  const tabIndex = TABS.findIndex((t) => t.value === tab);
  const swipe = useSwipe(
    (direction) => {
      const next = TABS[tabIndex + direction];
      if (next) pickTab(next.value);
    },
    { next: tabIndex < TABS.length - 1, prev: tabIndex > 0 }
  );

  // Read through a ref: depending on `text` would hand every poster a new callback on each
  // keystroke and re-render the whole grid
  const typed = useRef(text);
  useEffect(() => {
    typed.current = text;
  });
  const openResult = useCallback(
    (t: Title, tag: string) => {
      addRecent(typed.current);
      open(t, tag);
    },
    [addRecent, open]
  );

  if (!hasTmdb()) {
    return (
      <View className="flex-1">
        <ScreenHeader title="Search" />
        <NeedsKey />
      </View>
    );
  }

  const header = (
    <>
      <ScreenHeader title="Search" />
      <SearchField
        value={query}
        onChangeText={setQuery}
        onSubmit={() => addRecent(query)}
        onFilterPress={() => setFiltersOpen(true)}
        badge={activeCount(filters)}
      />
      {filters.genres.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {filters.genres.map((g) => (
            <Chip
              key={g}
              selected
              label={g}
              trailingIcon="close"
              onPress={() =>
                setFilters({ ...filters, genres: filters.genres.filter((x) => x !== g) })
              }
            />
          ))}
          {filters.minScore ? (
            <Chip
              selected
              label={`Score ${filters.minScore.toFixed(1)}+`}
              trailingIcon="close"
              onPress={() => setFilters({ ...filters, minScore: 0 })}
            />
          ) : null}
        </ScrollView>
      ) : null}
    </>
  );

  if (!showResults) {
    return (
      <View className="flex-1">
        {header}
        <View className="flex-1">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {recents.length ? (
              <View className="px-gutter pt-6">
                <View className="flex-row items-center justify-between">
                  <Text className="text-eyebrow font-semibold uppercase text-t3">Recent</Text>
                  <Pressable accessibilityRole="button" scale={0.94} onPress={clearRecents}>
                    <Text className="text-[13px] font-medium text-t3">Clear</Text>
                  </Pressable>
                </View>
                {recents.map((r) => (
                  <Pressable
                    key={r}
                    accessibilityRole="button"
                    scale={0.98}
                    onPress={() => setQuery(r)}
                    className="h-12 flex-row items-center gap-3">
                    <Icon name="clock" size={17} color={colors.t3} />
                    <Text className="flex-1 text-[16px] text-white">{r}</Text>
                    <Icon name="arrow" size={16} color={colors.t3} />
                  </Pressable>
                ))}
              </View>
            ) : null}

            {home.trending.length ? (
              <View className="px-gutter pt-7">
                <Text className="mb-3 text-eyebrow font-semibold uppercase text-t3">
                  Trending searches
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {home.trending.slice(0, 8).map((t) => (
                    <Chip key={t.id} label={t.name} onPress={() => setQuery(t.name)} />
                  ))}
                </View>
              </View>
            ) : null}

            <View className="px-gutter pt-7">
              <Text className="mb-3 text-eyebrow font-semibold uppercase text-t3">Browse</Text>
              <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                {GENRES.map((genre, i) => {
                  const uri = imageUrl(covers[genre], 'w780');
                  return (
                    <Reveal key={genre} index={Math.min(i, 6)} style={{ width: tile, height: 92 }}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={genre}
                        scale={0.96}
                        onPress={() => setFilters({ ...NO_FILTERS, genres: [genre] })}
                        style={{
                          width: tile,
                          height: 92,
                          overflow: 'hidden',
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                          backgroundColor: colors.s1,
                        }}>
                        {uri ? (
                          <Image
                            source={{ uri }}
                            resizeMode="cover"
                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                          />
                        ) : null}
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'flex-end',
                            padding: 12,
                            backgroundColor: 'rgba(0,0,0,0.45)',
                          }}>
                          <Text className="text-base font-bold text-white">{genre}</Text>
                        </View>
                      </Pressable>
                    </Reveal>
                  );
                })}
              </View>
            </View>
            <View className="h-10" />
          </ScrollView>
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24 }}>
            <Fade from="top" hold={0.1} />
          </View>
        </View>
        <FilterSheet
          visible={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          onChange={setFilters}
          count={null}
          loading={false}
        />
      </View>
    );
  }

  const results = (
    <>
      <View className="mt-4">
        <UnderlineTabs tabs={TABS} value={tab} onChange={pickTab} />
      </View>
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View style={[{ flex: 1 }, swipe.style]}>
          {search.failed ? (
            <EmptyState
              title="Couldn't load results"
              body="Check your connection and try again."
              action="Retry"
              onAction={search.retry}
            />
          ) : tab === 'people' ? (
            <FlatList
              data={search.people}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(p) => String(p.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
              onEndReached={search.loadMore}
              onEndReachedThreshold={0.6}
              ListEmptyComponent={
                search.loading ? undefined : (
                  <EmptyState
                    title="No people found"
                    body={
                      text
                        ? `Nothing for “${text}”.`
                        : 'Type a name to look for actors and directors.'
                    }
                  />
                )
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  scale={0.98}
                  onPress={() =>
                    router.push({ pathname: '/person/[id]', params: { id: String(item.id) } })
                  }
                  className="flex-row items-center gap-3 px-gutter py-2.5">
                  <Avatar name={item.name} size={52} photoPath={item.photoPath} />
                  <View className="flex-1">
                    <Text className="text-[16px] font-semibold text-white">{item.name}</Text>
                    {item.department ? (
                      <Text className="text-[13px] text-t3">{item.department}</Text>
                    ) : null}
                  </View>
                  <Icon name="chevronRight" size={16} color={colors.t3} />
                </Pressable>
              )}
            />
          ) : (
            <View className="flex-1">
              <FlatList
                data={search.titles}
                numColumns={COLUMNS}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                keyExtractor={(t) => t.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, gap: GAP }}
                columnWrapperStyle={{ gap: GAP }}
                onEndReached={search.loadMore}
                onEndReachedThreshold={0.6}
                ListHeaderComponent={
                  search.total && !search.loading ? (
                    <Text className="pb-3 text-eyebrow font-semibold uppercase text-t3">
                      {search.total.toLocaleString()} {search.total === 1 ? 'result' : 'results'}
                    </Text>
                  ) : undefined
                }
                ListEmptyComponent={
                  search.loading ? (
                    <View className="flex-row" style={{ gap: GAP }}>
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} width={poster} height={poster * 1.5} radius={14} />
                      ))}
                    </View>
                  ) : (
                    <EmptyState
                      title="No matches"
                      body="Try a different search or remove a filter."
                      action={filtering ? 'Clear filters' : undefined}
                      onAction={() => setFilters(NO_FILTERS)}
                    />
                  )
                }
                ListFooterComponent={
                  search.loadingMore ? (
                    <View className="items-center py-6">
                      <ActivityIndicator color={colors.t2} />
                    </View>
                  ) : undefined
                }
                initialNumToRender={12}
                maxToRenderPerBatch={9}
                windowSize={7}
                removeClippedSubviews
                renderItem={({ item, index }: { item: Title; index: number }) => {
                  const card = (
                    <Poster title={item} width={poster} showScore onPress={openResult} />
                  );
                  // Only the first screenful animates in. Entrance animations on every page of an
                  // endless list would cost frames while scrolling.
                  return index < 12 ? (
                    <Reveal index={index % 9} style={{ flex: 1 / COLUMNS }}>
                      {card}
                    </Reveal>
                  ) : (
                    <View style={{ flex: 1 / COLUMNS }}>{card}</View>
                  );
                }}
              />
              {/* Soft edge so posters fade out under the search field instead of being cut */}
              <View
                pointerEvents="none"
                style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24 }}>
                <Fade from="top" hold={0.1} />
              </View>
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </>
  );

  return (
    <View className="flex-1">
      {header}
      {results}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        count={search.total || null}
        loading={search.loading}
      />
    </View>
  );
}
