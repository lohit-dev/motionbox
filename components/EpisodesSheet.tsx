import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Sheet } from '@/components/Sheet';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { episodeBlurbs, episodeNames } from '@/data/extras';
import type { Title } from '@/types';

interface EpisodesSheetProps {
  title: Title;
  visible: boolean;
  onClose: () => void;
}

/** Season picker and episode list. Tapping an episode starts the player. */
export function EpisodesSheet({ title, visible, onClose }: EpisodesSheetProps) {
  const router = useRouter();
  const seasons = Array.from({ length: title.seasons ?? 1 }, (_, i) => i + 1);
  const [season, setSeason] = useState(1);

  return (
    <Sheet visible={visible} onClose={onClose} title="Episodes" height={640}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        {seasons.map((s) => (
          <Chip
            key={s}
            label={`Season ${s}`}
            selected={s === season}
            onPress={() => setSeason(s)}
          />
        ))}
      </ScrollView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {episodeNames.map((name, i) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            scale={0.98}
            onPress={() => {
              onClose();
              router.push({ pathname: '/player/[id]', params: { id: title.id } });
            }}
            className="flex-row items-center gap-3.5 py-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-s2">
              <Text className="text-[13px] font-bold text-white">{i + 1}</Text>
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-[15px] font-semibold text-white">
                {name}
              </Text>
              <Text numberOfLines={2} className="mt-0.5 text-[12.5px] leading-[17px] text-t3">
                {episodeBlurbs[i]}
              </Text>
            </View>
            <Icon name="play" size={16} />
          </Pressable>
        ))}
      </ScrollView>
    </Sheet>
  );
}
