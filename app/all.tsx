import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { CircleButton } from '@/components/ui/CircleButton';
import { Text } from '@/components/ui/Text';
import { useTitles } from '@/hooks/useTitle';
import { useOpenTitle } from '@/lib/flight';
import type { Title } from '@/types';

const COLUMNS = 3;
const GAP = 12;

/** "See all" for a Home row: every title of that row in a grid. The row's ids ride in the route. */
export default function SeeAll() {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const openTitle = useOpenTitle();
  const {
    title = 'All',
    ids = '',
    dates,
  } = useLocalSearchParams<{
    title: string;
    ids: string;
    dates?: string;
  }>();
  const list = useMemo(() => ids.split(',').filter(Boolean), [ids]);
  const { titles } = useTitles(list);
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
