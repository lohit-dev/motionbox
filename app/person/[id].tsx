import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { CircleButton } from '@/components/ui/CircleButton';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { usePerson } from '@/hooks/usePerson';
import { useOpenTitle } from '@/lib/flight';
import type { Person as PersonData } from '@/types';

const BIO_CUT = 150;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-[20px] font-extrabold text-white">{value}</Text>
      <Text className="mt-0.5 text-[12px] text-t3">{label}</Text>
    </View>
  );
}

export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openTitle = useOpenTitle();
  const { top } = useSafeAreaInsets();
  const { person, known, loading, failed, retry } = usePerson(Number(id));
  const [more, setMore] = useState(false);
  const [notify, setNotify] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View className="flex-1 bg-ink">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 16 : top + 8,
          paddingBottom: 48,
        }}>
        <View className="px-gutter pb-4">
          <CircleButton icon="back" label="Back" size={40} onPress={back} />
        </View>

        {loading ? (
          <View className="px-gutter pt-2">
            <View className="flex-row items-center gap-5">
              <Skeleton width={96} height={96} radius={48} />
              <Skeleton width={160} height={40} radius={8} />
            </View>
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
          <Reveal>
            <Header person={person} />
            <View className="mt-4 flex-row gap-2.5 px-gutter">
              <Pill
                title={notify ? 'Notifying you' : 'Notify me'}
                icon="bell"
                compact
                className="flex-1"
                onPress={() => setNotify((n) => !n)}
              />
              <CircleButton
                icon="share"
                label="Share"
                size={46}
                onPress={() => Share.share({ message: `${person.name} on Motion Box` })}
              />
            </View>
            {person.bio ? (
              <Text
                onPress={() => setMore((m) => !m)}
                className="mt-[18px] px-gutter text-[14.5px] leading-[22px] text-t2">
                {more || person.bio.length <= BIO_CUT * 1.4
                  ? person.bio
                  : `${person.bio.slice(0, Math.max(0, person.bio.lastIndexOf(' ', BIO_CUT)))}… `}
                {person.bio.length > BIO_CUT * 1.4 ? (
                  <Text className="font-bold text-white">{more ? '  Less' : 'More'}</Text>
                ) : null}
              </Text>
            ) : null}
          </Reveal>
        )}

        {known.length ? (
          <View>
            <SectionHeader title="Known for" />
            <Rail
              data={known}
              keyExtractor={(t) => t.id}
              renderItem={(t) => <Poster title={t} showScore onPress={openTitle} />}
            />
          </View>
        ) : null}

        {person && person.credits.length ? (
          <View>
            <SectionHeader title="Filmography" note={`${person.titleCount} titles`} />
            <View className="mx-gutter">
              {person.credits.slice(0, 40).map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center border-t border-white/10 py-3.5">
                  <Text className="w-[44px] text-[13px] text-t3">{c.year || '—'}</Text>
                  <Text numberOfLines={1} className="flex-1 text-[14.5px] font-semibold text-white">
                    {c.name}
                  </Text>
                  <Text numberOfLines={1} className="ml-3 max-w-[40%] text-[13px] text-t3">
                    {c.role}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Header({ person }: { person: PersonData }) {
  return (
    <>
      <View className="flex-row items-center gap-5 px-gutter pt-1.5">
        <Avatar name={person.name} size={96} photoPath={person.photoPath} />
        <View className="flex-1 flex-row justify-around">
          <Stat value={String(person.titleCount)} label="Titles" />
          <Stat value={person.avgScore ? person.avgScore.toFixed(1) : '—'} label="Avg score" />
          <Stat value={person.career ? `${person.career}y` : '—'} label="Career" />
        </View>
      </View>
      <View className="px-gutter pt-3.5">
        <Text className="text-[24px] font-extrabold tracking-tighter text-white">
          {person.name}
        </Text>
        {person.line ? <Text className="mt-0.5 text-[14px] text-t2">{person.line}</Text> : null}
      </View>
    </>
  );
}
