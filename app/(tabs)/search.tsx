import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Poster } from '@/components/Poster';
import { PosterArt } from '@/components/PosterArt';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchField } from '@/components/SearchField';
import { Sheet } from '@/components/Sheet';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { browseTiles, genres, recentSearches, trendingSearches } from '@/data/extras';
import { people } from '@/data/people';
import { getTitle, titles } from '@/data/titles';
import { useSearchTitles } from '@/hooks/useSearchTitles';
import { kindLine } from '@/lib/format';
import { useOpenTitle } from '@/lib/flight';
import type { Title, TitleKind } from '@/types';

interface Filters {
  kind: TitleKind | 'all';
  genre: string | null;
  minScore: number;
}

const NO_FILTERS: Filters = { kind: 'all', genre: null, minScore: 0 };

const activeCount = (f: Filters) =>
  (f.kind !== 'all' ? 1 : 0) + (f.genre ? 1 : 0) + (f.minScore ? 1 : 0);

export default function Search() {
  const router = useRouter();
  const open = useOpenTitle();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [recents, setRecents] = useState(recentSearches);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const filtering = activeCount(filters) > 0;
  const mode: 'idle' | 'typing' | 'results' =
    submitted || filtering ? 'results' : q ? 'typing' : 'idle';

  const remote = useSearchTitles(query, filters.genre);
  const matches = useMemo(() => {
    const pass = (t: Title) =>
      (filters.kind === 'all' || t.kind === filters.kind) && t.score >= filters.minScore;
    // Live TMDB results when a token is set, otherwise the bundled titles
    if (remote.results) {
      return remote.results.filter(
        (t) => pass(t) && (!filters.genre || !q || t.genres.includes(filters.genre))
      );
    }
    return titles.filter(
      (t) =>
        (!q ||
          t.name.toLowerCase().includes(q) ||
          t.genres.some((g) => g.toLowerCase().includes(q)) ||
          t.cast.some((c) => c.name.toLowerCase().includes(q))) &&
        (!filters.genre || t.genres.includes(filters.genre)) &&
        pass(t)
    );
  }, [q, filters, remote.results]);
  const peopleMatches = useMemo(
    () => (q ? people.filter((p) => p.name.toLowerCase().includes(q)) : []),
    [q]
  );

  const run = (text: string) => {
    setQuery(text);
    setSubmitted(true);
    if (text.trim())
      setRecents((r) => [text.trim(), ...r.filter((x) => x !== text.trim())].slice(0, 5));
  };
  const change = (text: string) => {
    setQuery(text);
    setSubmitted(false);
  };
  const tile = (width - 40 - 12) / 2;

  return (
    <View className="flex-1">
      <ScreenHeader title="Search" />
      <SearchField value={query} onChangeText={change} onFilterPress={() => setFiltersOpen(true)} />
      {filtering ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {filters.kind !== 'all' ? (
            <Chip
              selected
              label={filters.kind === 'movie' ? 'Movies' : 'Series'}
              trailingIcon="close"
              onPress={() => setFilters({ ...filters, kind: 'all' })}
            />
          ) : null}
          {filters.genre ? (
            <Chip
              selected
              label={filters.genre}
              trailingIcon="close"
              onPress={() => setFilters({ ...filters, genre: null })}
            />
          ) : null}
          {filters.minScore ? (
            <Chip
              selected
              label={`${filters.minScore}+ rating`}
              trailingIcon="close"
              onPress={() => setFilters({ ...filters, minScore: 0 })}
            />
          ) : null}
        </ScrollView>
      ) : null}

      {mode === 'idle' ? (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {recents.length ? (
            <View className="px-gutter pt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-eyebrow font-semibold uppercase text-t3">Recent</Text>
                <Pressable onPress={() => setRecents([])} scale={0.94}>
                  <Text className="text-[13px] text-t3">Clear</Text>
                </Pressable>
              </View>
              {recents.map((r, i) => (
                <Reveal key={r} index={i}>
                  <Pressable
                    onPress={() => run(r)}
                    scale={0.98}
                    className="h-12 flex-row items-center gap-3">
                    <Icon name="clock" size={16} color="rgba(255,255,255,0.54)" />
                    <Text className="flex-1 text-base text-white">{r}</Text>
                    <Icon name="arrow" size={16} color="rgba(255,255,255,0.54)" />
                  </Pressable>
                </Reveal>
              ))}
            </View>
          ) : null}

          <View className="px-gutter pt-6">
            <Text className="mb-3 text-eyebrow font-semibold uppercase text-t3">
              Trending searches
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {trendingSearches.map((t) => (
                <Chip key={t} label={t} onPress={() => run(t)} />
              ))}
            </View>
          </View>

          <View className="px-gutter pt-7">
            <Text className="mb-3 text-eyebrow font-semibold uppercase text-t3">Browse</Text>
            <View className="flex-row flex-wrap gap-3">
              {browseTiles.map((b, i) => {
                const t = getTitle(b.id);
                if (!t) return null;
                return (
                  <Reveal key={b.genre} index={i}>
                    <Pressable
                      accessibilityRole="button"
                      scale={0.96}
                      onPress={() => {
                        setQuery('');
                        setSubmitted(true);
                        setFilters({ ...NO_FILTERS, genre: b.genre });
                      }}>
                      <PosterArt title={t} width={tile} height={92} radius={18} />
                      <View className="absolute inset-0 justify-end rounded-[18px] bg-black/45 p-3">
                        <Text className="text-base font-bold text-white">{b.genre}</Text>
                      </View>
                    </Pressable>
                  </Reveal>
                );
              })}
            </View>
          </View>
          <View className="h-10" />
        </ScrollView>
      ) : null}

      {mode === 'typing' ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}>
          <Pressable
            onPress={() => run(query)}
            scale={0.98}
            className="h-12 flex-row items-center gap-3">
            <Icon name="search" size={18} color="rgba(255,255,255,0.54)" />
            <Text className="flex-1 text-base text-white">Search for “{query}”</Text>
          </Pressable>
          {matches.map((t, i) => (
            <Reveal key={t.id} index={i}>
              <Pressable
                onPress={() => open(t)}
                scale={0.98}
                className="flex-row items-center gap-3 py-2">
                <PosterArt title={t} width={44} height={66} radius={10} size="w185" />
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-base font-semibold text-white">
                    {t.name}
                  </Text>
                  <Text className="mt-0.5 text-[12.5px] text-t3">{kindLine(t)}</Text>
                </View>
              </Pressable>
            </Reveal>
          ))}
          {peopleMatches.map((p) => (
            <Pressable
              key={p.name}
              onPress={() => router.push({ pathname: '/person/[name]', params: { name: p.name } })}
              scale={0.98}
              className="flex-row items-center gap-3 py-2">
              <Avatar name={p.name} size={44} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">{p.name}</Text>
                <Text className="mt-0.5 text-[12.5px] text-t3">{p.line}</Text>
              </View>
            </Pressable>
          ))}
          {!matches.length && !peopleMatches.length ? (
            <EmptyState
              title="No matches"
              body={`Nothing for “${query}”. Check the spelling or try a genre.`}
            />
          ) : null}
        </ScrollView>
      ) : null}

      {mode === 'results' ? (
        <FlatList
          data={matches}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          ListHeaderComponent={
            <Text className="pb-3 text-eyebrow font-semibold uppercase text-t3">
              {matches.length} {matches.length === 1 ? 'result' : 'results'}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              title="No matches"
              body="Try removing a filter."
              action="Clear filters"
              onAction={() => {
                setFilters(NO_FILTERS);
                setSubmitted(false);
              }}
            />
          }
          renderItem={({ item, index }: { item: Title; index: number }) => (
            <Reveal index={index} style={{ flex: 1 / 3 }}>
              <Poster title={item} width={106} showScore onPress={open} />
            </Reveal>
          )}
        />
      ) : null}

      <Sheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        height={520}>
        <ScrollView className="px-gutter" showsVerticalScrollIndicator={false}>
          <Text className="mb-3 mt-2 text-eyebrow font-semibold uppercase text-t3">Type</Text>
          <View className="flex-row gap-2">
            {(['all', 'movie', 'series'] as const).map((k) => (
              <Chip
                key={k}
                label={k === 'all' ? 'All' : k === 'movie' ? 'Movies' : 'Series'}
                selected={filters.kind === k}
                onPress={() => setFilters({ ...filters, kind: k })}
              />
            ))}
          </View>
          <Text className="mb-3 mt-6 text-eyebrow font-semibold uppercase text-t3">Genre</Text>
          <View className="flex-row flex-wrap gap-2">
            {genres.map((g) => (
              <Chip
                key={g}
                label={g}
                selected={filters.genre === g}
                onPress={() => setFilters({ ...filters, genre: filters.genre === g ? null : g })}
              />
            ))}
          </View>
          <Text className="mb-3 mt-6 text-eyebrow font-semibold uppercase text-t3">
            Minimum rating
          </Text>
          <View className="flex-row gap-2">
            {[0, 6, 7, 8].map((n) => (
              <Chip
                key={n}
                label={n ? `${n}+` : 'Any'}
                selected={filters.minScore === n}
                onPress={() => setFilters({ ...filters, minScore: n })}
              />
            ))}
          </View>
          <View className="mb-6 mt-8 flex-row gap-3">
            <Pill
              title="Reset"
              tone="ghost"
              className="flex-1"
              onPress={() => setFilters(NO_FILTERS)}
            />
            <Pill
              title={`Show ${matches.length}`}
              className="flex-1"
              onPress={() => {
                setSubmitted(true);
                setFiltersOpen(false);
              }}
            />
          </View>
        </ScrollView>
      </Sheet>
    </View>
  );
}
