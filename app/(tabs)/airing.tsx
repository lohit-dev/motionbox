import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { AiringCard } from '@/components/AiringCard';
import { NeedsKey } from '@/components/NeedsKey';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Reveal } from '@/components/Reveal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Skeleton } from '@/components/Skeleton';
import { WeekStrip } from '@/components/WeekStrip';
import { useAiringWeek } from '@/hooks/useAiringWeek';
import { hasTmdb } from '@/lib/api';
import { currentWeek } from '@/lib/calendar';
import { useSwipe } from '@/hooks/useSwipe';
import { useOpenTitle } from '@/lib/flight';
import { getTitle } from '@/lib/titles';
import { useApp } from '@/store/store';
import type { AiringSegment } from '@/types';

const SEGMENTS: { value: AiringSegment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'My list' },
];

export default function Airing() {
  const week = useMemo(() => currentWeek(), []);
  const saved = useApp((s) => s.saved);
  const reminders = useApp((s) => s.reminders);
  const airingDay = useApp((s) => s.airingDay);
  const airingSegment = useApp((s) => s.airingSegment);
  const setAiringDay = useApp((s) => s.setAiringDay);
  const setAiringSegment = useApp((s) => s.setAiringSegment);
  const toggleReminder = useApp((s) => s.toggleReminder);

  const [reload, setReload] = useState(0);
  const { schedule, loading, failed } = useAiringWeek(reload);
  const open = useOpenTitle();

  // Swipe the list sideways to move to the next or previous day
  const swipe = useSwipe(
    (direction) => {
      const next = airingDay + direction;
      if (next >= 0 && next < week.length) setAiringDay(next);
    },
    { next: airingDay < week.length - 1, prev: airingDay > 0 }
  );

  const rows = (schedule[airingDay] ?? []).filter(
    (e) => airingSegment === 'all' || reminders.includes(e.id) || saved.includes(e.id)
  );

  if (!hasTmdb()) {
    return (
      <View className="flex-1">
        <ScreenHeader title="Airing" />
        <NeedsKey />
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Airing"
        right={<Segmented options={SEGMENTS} value={airingSegment} onChange={setAiringSegment} />}
      />
      <WeekStrip days={week} selected={airingDay} onSelect={setAiringDay} />

      {/* key restarts the staggered entrance whenever the day or segment changes */}
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View style={[{ minHeight: 460 }, swipe.style]}>
          <View key={`${airingDay}-${airingSegment}`} className="gap-3 px-gutter pt-4">
            {loading ? (
              [0, 1, 2, 3].map((i) => <Skeleton key={i} height={112} radius={22} />)
            ) : failed ? (
              <OfflineBanner onRetry={() => setReload((n) => n + 1)} />
            ) : (
              rows.map((entry, i) => {
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
              })
            )}
            {!loading && !failed && rows.length === 0 ? (
              <View className="mt-16 items-center px-8">
                <Text className="text-xl font-bold text-white">
                  {airingSegment === 'mine' ? 'Nothing from your list' : 'Nothing airing'}
                </Text>
                <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
                  {airingSegment === 'mine'
                    ? 'Save a show or tap the bell on it to see it here.'
                    : 'Check another day.'}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>
      <View className="h-10" />
    </ScrollView>
  );
}
