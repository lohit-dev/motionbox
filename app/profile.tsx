import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
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
import { Switch } from '@/components/ui/Switch';
import { ease } from '@/lib/motion';
import { useApp } from '@/store/store';

const LANGUAGES = ['English', 'Hindi', 'Telugu'];
const TASTE: [string, number][] = [
  ['Thriller', 42],
  ['Horror', 28],
  ['Drama', 18],
];

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
  const {
    saved,
    watched,
    watching,
    settings,
    setSetting,
    language,
    setLanguage,
    clearHistory,
    offline,
    setOffline,
  } = useApp();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

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
          <Avatar name="King" size={84} />
          <View className="flex-1 flex-row justify-around">
            {[
              [saved.length, 'Saved'],
              [watched.length + Object.keys(watching).length, 'Watched'],
              ['38h', 'This year'],
            ].map(([n, l]) => (
              <View key={l} className="items-center">
                <Text className="text-[20px] font-extrabold text-white">{n}</Text>
                <Text className="mt-0.5 text-[12px] text-t3">{l}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <View className="px-gutter pt-4">
          <Text className="text-[18px] font-bold tracking-tight text-white">King</Text>
          <Text className="mt-0.5 text-[14px] text-t3">Watching since Nov 2026</Text>
          <View className="mt-4 flex-row gap-2.5">
            <Chip label="Edit profile" className="flex-1 justify-center" />
            <Chip
              label="Share taste"
              className="flex-1 justify-center"
              onPress={() =>
                Share.share({ message: 'My taste on Motion Box: Thriller, Horror, Drama.' })
              }
            />
          </View>
        </View>

        <View className="mx-gutter mt-6 rounded-card bg-s1 p-4 pb-4">
          <Text className="text-eyebrow font-semibold uppercase text-t3">Your taste</Text>
          {TASTE.map(([n, p], i) => (
            <TasteBar key={n} label={n} percent={p} index={i} />
          ))}
        </View>

        <View className="mx-gutter mt-5 overflow-hidden rounded-card bg-s1">
          <Row
            icon="bell"
            label="Episode reminders"
            right={
              <Switch
                label="Episode reminders"
                value={settings.reminders}
                onValueChange={(v) => setSetting('reminders', v)}
              />
            }
          />
          <Row
            icon="play"
            label="Autoplay trailers"
            right={
              <Switch
                label="Autoplay trailers"
                value={settings.autoplay}
                onValueChange={(v) => setSetting('autoplay', v)}
              />
            }
          />
          <Row
            icon="globe"
            label="Language"
            onPress={() => setLanguageOpen(true)}
            right={<Text className="text-[14px] text-t3">{LANGUAGES[language]}</Text>}
          />
          <Row
            icon="wifiOff"
            label="Simulate offline"
            right={<Switch label="Simulate offline" value={offline} onValueChange={setOffline} />}
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
            right={<Text className="text-[14px] text-t3">1.0</Text>}
          />
        </View>
      </ScrollView>

      <ActionSheet
        visible={languageOpen}
        title="Language"
        onClose={() => setLanguageOpen(false)}
        rows={LANGUAGES.map((l, i) => ({
          label: l,
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
