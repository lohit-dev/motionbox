import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { CircleButton } from '@/components/ui/CircleButton';
import { usePerson } from '@/hooks/usePerson';
import { useOpenTitle } from '@/lib/flight';

export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const { top } = useSafeAreaInsets();
  const { person, known, loading, failed, retry } = usePerson(Number(id));
  const [more, setMore] = useState(false);

  const bio = person?.bio ?? '';
  const short = bio.length > 260 ? `${bio.slice(0, Math.max(0, bio.lastIndexOf(' ', 260)))}…` : bio;

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 48 }}>
        <View className="px-gutter">
          <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
        </View>

        {loading ? (
          <View className="items-center px-gutter pt-6">
            <Skeleton width={128} height={128} radius={64} />
            <Skeleton width={180} height={26} radius={8} style={{ marginTop: 16 }} />
            <Skeleton width={240} height={14} radius={6} style={{ marginTop: 10 }} />
          </View>
        ) : failed || !person ? (
          <EmptyState
            title="Couldn't load this person"
            body="Check your connection and try again."
            action="Retry"
            onAction={retry}
          />
        ) : (
          <Reveal style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 }}>
            <Avatar name={person.name} size={128} photoPath={person.photoPath} />
            <Text className="mt-4 text-center text-[28px] font-extrabold tracking-tighter text-white">
              {person.name}
            </Text>
            {person.department ? (
              <Text className="mt-1 text-[14px] text-t2">{person.department}</Text>
            ) : null}
            {person.born ? (
              <Text className="mt-1 text-center text-[13px] text-t3">Born {person.born}</Text>
            ) : null}
            {bio ? (
              <Text
                onPress={() => setMore((m) => !m)}
                className="mt-6 self-stretch text-[15px] leading-6 text-t2">
                {more ? bio : short}
                {bio.length > 260 ? (
                  <Text className="font-bold text-white">{more ? '  Less' : '  More'}</Text>
                ) : null}
              </Text>
            ) : null}
          </Reveal>
        )}

        {known.length ? (
          <>
            <SectionHeader title="Known for" />
            <Rail
              data={known}
              keyExtractor={(t) => t.id}
              renderItem={(t) => <Poster title={t} showScore onPress={openTitle} />}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
