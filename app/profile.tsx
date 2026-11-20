import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ScrollView, Share, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { ActionSheet } from '@/components/ActionSheet';
import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/Reveal';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';
import { useTitles } from '@/hooks/useTitle';
import { ease } from '@/lib/motion';
import { LANGUAGES, useApp } from '@/store/store';

function TasteBar({ label, percent, index }: { label: string; percent: number; index: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withDelay(380 + index * 110, withTiming(percent, { duration: 900, easing: ease }));
  }, [percent, index, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View className="mt-3 flex-row items-center gap-3">
      <Text className="w-[74px] text-[13.5px] font-semibold text-white">{label}</Text>
      <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
        <Animated.View
          style={[{ height: 6, borderRadius: 3, backgroundColor: colors.white }, fill]}
        />
      </View>
      <Text className="w-[34px] text-right text-[12.5px] text-t3">{percent}%</Text>
    </View>
  );
}

function Row({
  icon,
  label,
  right,
  onPress,
}: {
  icon: IconName;
  label: string;
  right?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      scale={0.985}
      onPress={onPress}
      className="h-[58px] flex-row items-center gap-3.5 px-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-s2">
        <Icon name={icon} size={17} />
      </View>
      <Text className="flex-1 text-[15.5px] font-semibold text-white">{label}</Text>
      {right}
    </Pressable>
  );
}

export default function Profile() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const saved = useApp((s) => s.saved);
  const watched = useApp((s) => s.watched);
  const watching = useApp((s) => s.watching);
  const language = useApp((s) => s.language);
  const setLanguage = useApp((s) => s.setLanguage);
  const clearHistory = useApp((s) => s.clearHistory);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const tracked = useMemo(
    () => Array.from(new Set([...saved, ...watching, ...watched])),
    [saved, watching, watched]
  );
  const { titles } = useTitles(tracked);

  // Share of each genre across everything saved, being watched or watched. Top three.
  const taste = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of titles) for (const g of t.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    if (!total) return [] as [string, number][];
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g, n]) => [g, Math.round((n / total) * 100)] as [string, number]);
  }, [titles]);

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 48 }}>
        <View className="px-gutter">
          <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
        </View>

        <Reveal
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
          }}>
          <Avatar name="Motion Box" size={84} />
          <View className="flex-1 flex-row justify-around">
            {[
              [saved.length, 'Saved'],
              [watching.length, 'Watching'],
              [watched.length, 'Watched'],
            ].map(([n, l]) => (
              <View key={l} className="items-center">
                <Text className="text-[20px] font-extrabold text-white">{n}</Text>
                <Text className="mt-0.5 text-[12px] text-t3">{l}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <View className="px-gutter pt-4">
          <Text className="text-[18px] font-bold tracking-tight text-white">Your library</Text>
          <Text className="mt-0.5 text-[14px] text-t3">
            {tracked.length
              ? `${tracked.length} ${tracked.length === 1 ? 'title' : 'titles'} tracked`
              : 'Nothing tracked yet'}
          </Text>
          {taste.length ? (
            <View className="mt-4 flex-row gap-2.5">
              <Chip
                label="Share taste"
                className="flex-1 justify-center"
                onPress={() =>
                  Share.share({
                    message: `My taste on Motion Box: ${taste.map(([g]) => g).join(', ')}.`,
                  })
                }
              />
            </View>
          ) : null}
        </View>

        {taste.length ? (
          <View className="mx-gutter mt-6 rounded-card bg-s1 p-4 pb-4">
            <Text className="text-eyebrow font-semibold uppercase text-t3">Your taste</Text>
            {taste.map(([n, p], i) => (
              <TasteBar key={n} label={n} percent={p} index={i} />
            ))}
          </View>
        ) : null}

        <View className="mx-gutter mt-5 overflow-hidden rounded-card bg-s1">
          <Row
            icon="globe"
            label="Language"
            onPress={() => setLanguageOpen(true)}
            right={<Text className="text-[14px] text-t3">{LANGUAGES[language]?.label}</Text>}
          />
          <Row
            icon="trash"
            label="Clear watch history"
            onPress={() => setClearOpen(true)}
            right={<Icon name="chevronRight" size={16} color={colors.t3} />}
          />
          <Row
            icon="info"
            label="About Motion Box"
            right={<Text className="text-[14px] text-t3">1.0 · Data from TMDB</Text>}
          />
        </View>
      </ScrollView>

      <ActionSheet
        visible={languageOpen}
        title="Language"
        onClose={() => setLanguageOpen(false)}
        rows={LANGUAGES.map((l, i) => ({
          label: l.label,
          icon: i === language ? 'check' : undefined,
          onPress: () => setLanguage(i),
        }))}
      />
      <ActionSheet
        visible={clearOpen}
        title="Clear watch history?"
        onClose={() => setClearOpen(false)}
        rows={[{ label: 'Clear history', icon: 'trash', destructive: true, onPress: clearHistory }]}
      />
    </View>
  );
}
