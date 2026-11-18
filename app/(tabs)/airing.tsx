import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AiringCard } from '@/components/AiringCard';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { WeekStrip } from '@/components/WeekStrip';
import { airing } from '@/data/airing';
import { getTitle } from '@/data/titles';
import { currentWeek } from '@/lib/calendar';
import { useApp } from '@/store/store';
import type { AiringSegment, Title } from '@/types';

const SEGMENTS: { value: AiringSegment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'My list' },
];

export default function Airing() {
  const router = useRouter();
  const week = useMemo(() => currentWeek(), []);
  const { airingDay, airingSegment, reminders, setAiringDay, setAiringSegment, toggleReminder } =
    useApp();

  const rows = (airing[airingDay] ?? []).filter(
    (e) => airingSegment === 'all' || reminders.includes(e.id)
  );
  const open = (t: Title) => router.push({ pathname: '/title/[id]', params: { id: t.id } });

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Airing"
        right={<Segmented options={SEGMENTS} value={airingSegment} onChange={setAiringSegment} />}
      />
      <WeekStrip days={week} selected={airingDay} onSelect={setAiringDay} />

      {/* key restarts the staggered entrance whenever the day or segment changes */}
      <View key={`${airingDay}-${airingSegment}`} className="gap-3 px-gutter pt-4">
        {rows.map((entry, i) => {
          const title = getTitle(entry.id);
          if (!title) return null;
          return (
            <Reveal key={`${entry.id}-${entry.time}`} index={i}>
              <AiringCard
                entry={entry}
                title={title}
                reminded={reminders.includes(entry.id)}
                onToggleReminder={toggleReminder}
                onPress={open}
              />
            </Reveal>
          );
        })}
        {rows.length === 0 ? (
          <View className="mt-16 items-center px-8">
            <Text className="text-xl font-bold text-white">
              {airingSegment === 'mine' ? 'No reminders for this day' : 'Nothing airing'}
            </Text>
            <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
              {airingSegment === 'mine'
                ? 'Tap the bell on any show to be reminded.'
                : 'Check another day.'}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="h-10" />
    </ScrollView>
  );
}
