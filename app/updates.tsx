import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PosterArt } from '@/components/PosterArt';
import { Reveal } from '@/components/Reveal';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Pressable } from '@/components/ui/Pressable';
import { updates } from '@/data/extras';
import { getTitle } from '@/data/titles';
import { useApp } from '@/store/store';

export default function Updates() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { updatesRead, markUpdatesRead } = useApp();

  const row = (u: (typeof updates)[number], i: number) => {
    const t = getTitle(u.id);
    if (!t) return null;
    return (
      <Reveal key={u.id + u.when} index={i}>
        <Pressable
          accessibilityRole="button"
          scale={0.98}
          onPress={() => router.push({ pathname: '/title/[id]', params: { id: t.id } })}
          className="flex-row items-center gap-3 px-gutter py-3">
          <View
            className={`h-2 w-2 rounded-full ${u.unread && !updatesRead ? 'bg-white' : 'bg-transparent'}`}
          />
          <PosterArt title={t} width={46} height={68} radius={10} size="w342" />
          <View className="flex-1">
            <Text className="text-[15px] leading-[21px] text-white">
              <Text className="font-bold">{t.name}</Text> {u.text}
            </Text>
            <Text className="mt-0.5 text-[12.5px] text-t3">{u.when}</Text>
          </View>
          {u.action ? (
            <Chip
              label={u.action}
              onPress={() => router.push({ pathname: '/player/[id]', params: { id: t.id } })}
            />
          ) : null}
        </Pressable>
      </Reveal>
    );
  };

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between px-gutter">
          <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
          <Pressable accessibilityRole="button" scale={0.94} onPress={markUpdatesRead}>
            <Text className="text-[14px] font-semibold text-white">Mark all read</Text>
          </Pressable>
        </View>
        <Text className="mt-4 px-gutter text-[32px] font-extrabold tracking-tighter text-white">
          Updates
        </Text>
        <Text className="mx-gutter mb-1 mt-7 text-eyebrow font-semibold uppercase text-t3">
          Today
        </Text>
        {updates.slice(0, 3).map(row)}
        <Text className="mx-gutter mb-1 mt-7 text-eyebrow font-semibold uppercase text-t3">
          Earlier
        </Text>
        {updates.slice(3).map((u, i) => row(u, i + 3))}
      </ScrollView>
    </View>
  );
}
