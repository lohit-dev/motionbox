import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Poster } from '@/components/Poster';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { titles } from '@/data/titles';
import type { Title } from '@/types';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return titles;
    return titles.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.genres.some((g) => g.toLowerCase().includes(q)) ||
        t.cast.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query]);

  const open = (t: Title) => router.push({ pathname: '/title/[id]', params: { id: t.id } });

  return (
    <View className="flex-1">
      <ScreenHeader title="Search" />
      <SearchField value={query} onChangeText={setQuery} />
      <FlatList
        data={results}
        numColumns={3}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ListHeaderComponent={
          <Text className="pb-3 text-eyebrow font-semibold uppercase text-t3">
            {query.trim() ? `${results.length} results` : 'Trending'}
          </Text>
        }
        ListEmptyComponent={
          <Text className="mt-12 text-center text-[14.5px] text-t2">No matches for “{query}”.</Text>
        }
        renderItem={({ item, index }) => (
          <Reveal index={index} style={{ flex: 1 / 3 }}>
            <Poster title={item} width={106} onPress={open} />
          </Reveal>
        )}
      />
    </View>
  );
}
