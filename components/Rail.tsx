import type { ReactElement } from 'react';
import { FlatList } from 'react-native';

import { Reveal } from '@/components/Reveal';

interface RailProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number) => ReactElement;
  gap?: number;
}

/** Horizontal rail with 20pt gutters. Items rise in one after another. */
export function Rail<T>({ data, keyExtractor, renderItem, gap = 12 }: RailProps<T>) {
  return (
    <FlatList
      horizontal
      data={data}
      keyExtractor={keyExtractor}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap }}
      renderItem={({ item, index }) => <Reveal index={index}>{renderItem(item, index)}</Reveal>}
    />
  );
}
