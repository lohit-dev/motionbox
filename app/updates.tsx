import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/EmptyState';
import { PosterArt } from '@/components/PosterArt';
import { Reveal } from '@/components/Reveal';
import { Skeleton } from '@/components/Skeleton';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Pressable } from '@/components/ui/Pressable';
import { useUpdates, type UpdateItem } from '@/hooks/useUpdates';
import { openTrailer } from '@/lib/trailer';
import { useApp } from '@/store/store';

export default function Updates() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const { updatesRead, markUpdatesRead } = useApp();
  const updates = useUpdates();

  const row = (u: UpdateItem, i: number) => (
    <Reveal key={`${u.id}-${u.text}`} index={i}>
      <Pressable
        accessibilityRole="button"
        scale={0.98}
        onPress={() => router.push({ pathname: '/title/[id]', params: { id: u.id } })}
        className="flex-row items-center gap-3 px-gutter py-3">
        <View className={`h-2 w-2 rounded-full ${updatesRead ? 'bg-transparent' : 'bg-white'}`} />
        <PosterArt title={u.title} width={46} height={68} radius={10} size="w342" />
        <View className="flex-1">
          <Text className="text-[15px] leading-[21px] text-white">
            <Text className="font-bold">{u.title.name}</Text> {u.text}
          </Text>
          <Text className="mt-0.5 text-[12.5px] text-t3">{u.when}</Text>
        </View>
        {u.trailer ? <Chip label="Trailer" onPress={() => openTrailer(u.title)} /> : null}
      </Pressable>
    </Reveal>
  );

  const section = (label: string, items: UpdateItem[]) =>
    items.length ? (
      <>
        <Text className="mx-gutter mb-1 mt-7 text-eyebrow uppercase text-t3 font-semibold">
          {label}
        </Text>
        {items.map(row)}
      </>
    ) : null;

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between px-gutter">
          <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
          {updates.count ? (
            <Pressable accessibilityRole="button" scale={0.94} onPress={markUpdatesRead}>
              <Text className="text-[14px] text-white font-semibold">Mark all read</Text>
            </Pressable>
          ) : null}
        </View>
        <Text className="mt-4 px-gutter text-[32px] tracking-tighter text-white font-extrabold">
          Updates
        </Text>

        {updates.loading ? (
          <View className="gap-4 px-gutter pt-8">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={68} radius={12} />
            ))}
          </View>
        ) : updates.count === 0 ? (
          <EmptyState
            title="No updates yet"
            body="Save a series or movie and new episodes and release dates show up here."
            action="Find something"
            onAction={() => router.replace('/search')}
          />
        ) : (
          <>
            {section('Today', updates.today)}
            {section('Coming up', updates.upcoming)}
            {section('Earlier', updates.earlier)}
          </>
        )}
      </ScrollView>
    </View>
  );
}
