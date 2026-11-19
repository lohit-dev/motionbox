import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { CircleButton } from '@/components/ui/CircleButton';
import { Pill } from '@/components/ui/Pill';
import { getPerson } from '@/data/people';
import { titles } from '@/data/titles';
import { useOpenTitle } from '@/lib/flight';

export default function Person() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const { top } = useSafeAreaInsets();
  const [following, setFollowing] = useState(false);
  const person = getPerson(name ?? '');
  const known = titles.filter((t) => t.cast.some((c) => c.name === name));

  return (
    <View className="flex-1 bg-ink">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: top + 8, paddingBottom: 48 }}>
        <View className="px-gutter">
          <CircleButton icon="back" label="Back" size={44} onPress={() => router.back()} />
        </View>
        {person ? (
          <Reveal style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 }}>
            <Avatar name={person.name} size={112} />
            <Text className="mt-4 text-[28px] font-extrabold tracking-tighter text-white">{person.name}</Text>
            <Text className="mt-1 text-[14px] text-t3">{person.line}</Text>
            <View className="mt-5 w-full">
              <Pill
                title={following ? 'Following' : 'Follow'}
                icon={following ? 'check' : 'plus'}
                tone={following ? 'ghost' : 'primary'}
                onPress={() => setFollowing((f) => !f)}
              />
            </View>
            <Text className="mt-6 text-[15px] leading-6 text-t2">{person.bio}</Text>
          </Reveal>
        ) : (
          <Text className="mt-16 text-center text-xl font-bold text-white">Person not found</Text>
        )}
        {known.length ? (
          <>
            <SectionHeader title="Known for" />
            <Rail data={known} keyExtractor={(t) => t.id} renderItem={(t) => <Poster title={t} showScore onPress={openTitle} />} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
