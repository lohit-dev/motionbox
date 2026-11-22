import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { CircleButton } from '@/components/ui/CircleButton';
import { Text } from '@/components/ui/Text';
import { useTitles } from '@/hooks/useTitle';
import { loadFeed, type FeedKind } from '@/lib/api';
import { useOpenTitle } from '@/lib/flight';
import type { Title } from '@/types';

const COLUMNS = 3;
const GAP = 12;

/**
 * "See all" for a Home row, as a grid. Rows that come from TMDB (`feed`) keep loading the next
 * page as you reach the bottom. Rows that are yours (Continue watching, Because you saved) are a
 * fixed list: their ids ride in the route.
 */
export default function SeeAll() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const openTitle = useOpenTitle();
  const {
    title = 'All',
    ids = '',
    dates,
    feed,
  } = useLocalSearchParams<{
    title: string;
    ids: string;
    dates?: string;
    feed?: FeedKind;
  }>();
  const list = useMemo(() => ids.split(',').filter(Boolean), [ids]);
  const { titles: seed } = useTitles(list);
  const { more, loading, next } = usePages(feed);
  // The row Home already showed comes first, the pages that follow are added after it
  const titles = useMemo(() => {
    const seen = new Set(seed.map((t) => t.id));
    return [...seed, ...more.filter((t) => !seen.has(t.id))];
  }, [seed, more]);
  const poster = (width - 40 - GAP * (COLUMNS - 1)) / COLUMNS;

  const render = useCallback(
    ({ item, index }: { item: Title; index: number }) => {
      const card = (
        <Poster
          title={item}
          width={poster}
          date={dates ? item.released.slice(0, 6) : undefined}
          onPress={openTitle}
        />
      );
      return index < 12 ? <Reveal index={index % COLUMNS}>{card}</Reveal> : card;
    },
    [poster, dates, openTitle]
  );

  return (
    <View className="flex-1 bg-ink">
      <FlatList
        data={titles}
        keyExtractor={(t) => t.id}
        numColumns={COLUMNS}
        renderItem={render}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 20, paddingTop: top + 8, paddingBottom: bottom + 40 }}
        initialNumToRender={12}
        windowSize={7}
        onEndReached={next}
        onEndReachedThreshold={0.8}
        ListFooterComponent={
          loading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#fff" />
            </View>
          ) : null
        }
        ListHeaderComponent={
          <View className="mb-1 px-gutter">
            <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
            <Text className="mt-4 text-[32px] font-extrabold tracking-tighter text-white">
              {title}
            </Text>
          </View>
        }
      />
    </View>
  );
}

/** Pages 1, 2, 3... of a feed, one more each time `next` is called. Nothing happens without a feed. */
function usePages(feed?: FeedKind) {
  const [more, setMore] = useState<Title[]>([]);
  const [loading, setLoading] = useState(!!feed);
  const page = useRef(0);
  const busy = useRef(false);
  const done = useRef(!feed);

  const next = useCallback(() => {
    if (!feed || busy.current || done.current) return;
    busy.current = true;
    setLoading(true);
    loadFeed(feed, page.current + 1)
      .then((res) => {
        page.current += 1;
        done.current = !res.hasMore;
        setMore((m) => [...m, ...res.titles]);
      })
      .catch(() => {
        // Stop quietly; scrolling to the bottom again tries the same page once more
      })
      .finally(() => {
        busy.current = false;
        setLoading(false);
      });
  }, [feed]);

  useEffect(() => {
    next();
  }, [next]);

  return { more, loading, next };
}
