import { ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Sheet } from '@/components/Sheet';
import { Slider } from '@/components/Slider';
import { Chip } from '@/components/ui/Chip';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { GENRES } from '@/lib/api';
import { NO_FILTERS, type Filters, type Sort } from '@/types';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
  /** Total results for the current filters, when known */
  count: number | null;
  loading: boolean;
}

const KINDS = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'series', label: 'Series' },
] as const;

const SORTS: { value: Sort; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'top', label: 'Top rated' },
  { value: 'new', label: 'Newest' },
];

const Label = ({ children }: { children: string }) => (
  <Text className="text-eyebrow font-semibold uppercase text-t3">{children}</Text>
);

/** Filters. Genres can be combined, and results update behind the sheet as you change things. */
export function FilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  count,
  loading,
}: FilterSheetProps) {
  const { height } = useWindowDimensions();
  const toggleGenre = (g: string) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(g)
        ? filters.genres.filter((x) => x !== g)
        : [...filters.genres, g],
    });

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      height={Math.min(720, Math.round(height * 0.88))}>
      <View className="flex-1">
        <ScrollView
          className="px-gutter"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}>
          <View className="flex-row items-center justify-between pt-1">
            <Label>Genre</Label>
            <Pressable accessibilityRole="button" scale={0.94} onPress={() => onChange(NO_FILTERS)}>
              <Text className="text-[14px] font-semibold text-t2">Reset</Text>
            </Pressable>
          </View>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={filters.genres.includes(g)}
                onPress={() => toggleGenre(g)}
              />
            ))}
          </View>

          <View className="mt-7 flex-row items-baseline justify-between">
            <Label>Minimum score</Label>
            <Text className="text-[16px] font-bold text-white">{filters.minScore.toFixed(1)}</Text>
          </View>
          <Slider
            value={filters.minScore}
            onChange={(minScore) => onChange({ ...filters, minScore })}
          />
          <View className="flex-row justify-between">
            <Text className="text-[12px] text-t3">0</Text>
            <Text className="text-[12px] text-t3">10</Text>
          </View>

          <View className="mt-7">
            <Label>Type</Label>
          </View>
          <View className="mt-3 flex-row gap-2">
            {KINDS.map((k) => (
              <Chip
                key={k.value}
                label={k.label}
                selected={filters.kind === k.value}
                onPress={() => onChange({ ...filters, kind: k.value })}
              />
            ))}
          </View>

          <View className="mt-7">
            <Label>Sort by</Label>
          </View>
          <View className="mt-3 flex-row gap-2">
            {SORTS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                selected={filters.sort === s.value}
                onPress={() => onChange({ ...filters, sort: s.value })}
              />
            ))}
          </View>
        </ScrollView>
        <View className="absolute bottom-4 left-gutter right-gutter">
          <Pill
            title={
              loading
                ? 'Searching…'
                : count == null
                  ? 'Show results'
                  : `Show ${count.toLocaleString()} result${count === 1 ? '' : 's'}`
            }
            onPress={onClose}
          />
        </View>
      </View>
    </Sheet>
  );
}
