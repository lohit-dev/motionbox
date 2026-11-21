import { useCallback, type ReactElement } from 'react';
import { FlatList } from 'react-native';

import { Reveal } from '@/components/Reveal';

interface RailProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactElement;
  gap?: number;
}

const GUTTER = { paddingHorizontal: 20 } as const;

/** Horizontal rail with 20pt gutters. The first screenful of items rises in one after another. */
export function Rail<T>({ data, keyExtractor, renderItem, gap = 12 }: RailProps<T>) {
  const render = useCallback(
    ({ item, index }: { item: T; index: number }) =>
      // Items scrolled in later appear plainly: replaying an entrance while swiping looks noisy
      index < 6 ? (
        <Reveal index={index}>{renderItem(item, index)}</Reveal>
      ) : (
        renderItem(item, index)
      ),
    [renderItem]
  );
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ ...GUTTER, gap }}
      renderItem={render}
    />
  );
}
