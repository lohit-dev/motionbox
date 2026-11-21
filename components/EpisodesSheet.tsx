import { useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';

import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { EmptyState } from '@/components/EmptyState';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { Chip } from '@/components/ui/Chip';
import { useSeason } from '@/hooks/useSeason';
import { imageUrl } from '@/lib/tmdb';
import type { Title } from '@/types';

interface EpisodesSheetProps {
  title: Title;
  visible: boolean;
  onClose: () => void;
}

/** Season picker and the real episode list for the chosen season. */
export function EpisodesSheet({ title, visible, onClose }: EpisodesSheetProps) {
  const { height } = useWindowDimensions();
  const seasons = title.seasonList?.length
    ? title.seasonList
    : Array.from({ length: title.seasons ?? 1 }, (_, i) => ({
        number: i + 1,
        name: `Season ${i + 1}`,
        episodeCount: 0,
      }));
  const [season, setSeason] = useState(seasons[0]?.number ?? 1);
  const { episodes, loading, failed, retry } = useSeason(title.id, season, visible);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Episodes"
      height={Math.min(680, Math.round(height * 0.86))}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {seasons.map((s) => (
          <Chip
            key={s.number}
            label={`Season ${s.number}`}
            selected={s.number === season}
            onPress={() => setSeason(s.number)}
          />
        ))}
      </ScrollView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {loading ? (
          <View className="gap-4 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={84} radius={14} />
            ))}
          </View>
        ) : failed ? (
          <EmptyState
            title="Couldn't load episodes"
            body="Check your connection and try again."
            action="Retry"
            onAction={retry}
          />
        ) : episodes.length === 0 ? (
          <EmptyState title="No episodes yet" body="This season has no episode listings." />
        ) : (
          episodes.map((e) => {
            const still = imageUrl(e.stillPath, 'w342');
            return (
              <View key={e.number} className="flex-row gap-3.5 py-3">
                <View
                  className="overflow-hidden rounded-[12px] bg-s2"
                  style={{ width: 128, height: 72 }}>
                  {still ? (
                    <Image source={{ uri: still }} style={{ width: 128, height: 72 }} />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <Text className="text-[20px] font-bold" style={{ color: colors.t3 }}>
                        {e.number}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[15px] font-semibold text-white">
                    {e.number}. {e.name}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-t3">
                    {[e.airDate, e.runtime ? `${e.runtime}m` : ''].filter(Boolean).join(' · ')}
                  </Text>
                  {e.overview ? (
                    <Text numberOfLines={3} className="mt-1 text-[12.5px] leading-[17px] text-t2">
                      {e.overview}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </Sheet>
  );
}
