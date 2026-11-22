import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Fade } from '@/components/Fade';
import { Poster } from '@/components/Poster';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { Skeleton } from '@/components/Skeleton';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { Text } from '@/components/ui/Text';
import { usePerson } from '@/hooks/usePerson';
import { openTitle, useOpenTitle } from '@/lib/flight';
import { sharePerson } from '@/lib/share';
import { imageUrl } from '@/lib/tmdb';
import type { Credit, Person as PersonData } from '@/types';

const BIO_CUT = 150;
/** Credits shown before "Show all" */
const FIRST = 12;

type Filter = 'all' | 'movie' | 'series';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-s1 py-3.5">
      <Text className="text-[20px] font-extrabold text-white">{value}</Text>
      <Text className="mt-0.5 text-[12px] text-t3">{label}</Text>
    </View>
  );
}

export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const openPoster = useOpenTitle();
  const { top } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { person, known, loading, failed, retry } = usePerson(Number(id));
  const [more, setMore] = useState(false);
  const [notify, setNotify] = useState(false);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const photo = person ? imageUrl(person.photoPath, 'h632') : null;
  const heroH = Math.round(width * 1.08);

  return (
    <View className="flex-1 bg-ink">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 56 }}>
        {person && !loading ? (
          <View style={{ height: heroH }}>
            {photo ? (
              <Image
                source={{ uri: photo }}
                resizeMode="cover"
                style={{ position: 'absolute', top: 0, width, height: heroH }}
              />
            ) : (
              <View className="absolute inset-0 items-center justify-center bg-s1">
                <Avatar name={person.name} size={140} />
              </View>
            )}
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: top + 70, opacity: 0.5 }}>
              <Fade from="top" hold={0.2} />
            </View>
            <View
              pointerEvents="none"
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: heroH * 0.6 }}>
              <Fade from="bottom" />
            </View>
            <View className="absolute bottom-1" style={{ left: 20, right: 20 }}>
              <Text numberOfLines={2} className="text-[36px] font-extrabold tracking-tighter text-white" style={{ lineHeight: 38 }}>
                {person.name}
              </Text>
              {person.line ? (
                <Text className="mt-1 text-[14.5px] text-t2">{person.line}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={{ height: top + 64 }} />
        )}

        {loading ? (
          <View className="px-gutter pt-2">
            <Skeleton width={220} height={36} radius={8} />
            <Skeleton width={180} height={14} radius={6} style={{ marginTop: 12 }} />
            <View className="mt-6 flex-row gap-2.5">
              <Skeleton width={104} height={74} radius={16} />
              <Skeleton width={104} height={74} radius={16} />
              <Skeleton width={104} height={74} radius={16} />
            </View>
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
            <View className="mt-3 flex-row gap-2.5 px-gutter">
              <Stat value={String(person.titleCount)} label="Titles" />
              <Stat value={person.avgScore ? person.avgScore.toFixed(1) : '—'} label="Avg score" />
              <Stat value={person.career ? `${person.career}y` : '—'} label="Career" />
            </View>
            <View className="mt-4 flex-row gap-2.5 px-gutter">
              <Pill
                title={notify ? 'Notifying you' : 'Notify me'}
                icon="bell"
                compact
                className="flex-1"
                onPress={() => setNotify((n) => !n)}
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
              renderItem={(t) => <Poster title={t} showScore onPress={openPoster} />}
            />
          </View>
        ) : null}

        {person && person.credits.length ? <Filmography person={person} /> : null}
      </ScrollView>

      {/* Buttons float over the photo, below the status bar */}
      <View
        pointerEvents="box-none"
        className="absolute left-4 right-4 flex-row items-center justify-between"
        style={{ top: top + 8 }}>
        <CircleButton icon="back" label="Back" size={40} tone="glass" onPress={back} />
        {person ? (
          <CircleButton
            icon="share"
            label="Share"
            size={40}
            tone="glass"
            onPress={() => sharePerson(person)}
          />
        ) : null}
      </View>
    </View>
  );
}

/** Credits as poster rows, grouped by year, filtered by Movies / Series, shortened until asked */
function Filmography({ person }: { person: PersonData }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [all, setAll] = useState(false);

  const credits = useMemo(
    () => person.credits.filter((c) => filter === 'all' || c.kind === filter),
    [person.credits, filter]
  );
  const shown = all ? credits : credits.slice(0, FIRST);
  const movies = person.credits.filter((c) => c.kind === 'movie').length;

  return (
    <View>
      <SectionHeader title="Filmography" note={`${person.titleCount} titles`} />
      <View className="flex-row gap-2 px-gutter pb-2">
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip
          label={`Movies ${movies}`}
          selected={filter === 'movie'}
          onPress={() => setFilter('movie')}
        />
        <Chip
          label={`Series ${person.credits.length - movies}`}
          selected={filter === 'series'}
          onPress={() => setFilter('series')}
        />
      </View>

      <View className="px-gutter">
        {shown.map((c, i) => (
          <CreditRow key={c.id} credit={c} newYear={i === 0 || shown[i - 1].year !== c.year} />
        ))}
      </View>

      {!all && credits.length > FIRST ? (
        <View className="mt-4 px-gutter">
          <Pill
            tone="ghost"
            title={`Show all ${credits.length} titles`}
            onPress={() => setAll(true)}
          />
        </View>
      ) : null}
    </View>
  );
}

function CreditRow({ credit, newYear }: { credit: Credit; newYear: boolean }) {
  const art = imageUrl(credit.posterPath, 'w185');
  return (
    <View>
      {newYear ? (
        <Text className="pb-2 pt-5 text-[13px] font-bold tracking-widest text-t3">
          {credit.year || 'TBA'}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={credit.name}
        onPress={() => openTitle({ id: credit.id })}
        scale={0.985}
        className="flex-row items-center gap-3.5 py-2">
        <View className="h-[78px] w-[52px] overflow-hidden rounded-[10px] bg-s2">
          {art ? (
            <Image source={{ uri: art }} style={{ width: 52, height: 78 }} resizeMode="cover" />
          ) : null}
        </View>
        <View className="flex-1">
          <Text numberOfLines={2} className="text-[15.5px] font-semibold text-white">
            {credit.name}
          </Text>
          <Text numberOfLines={1} className="mt-0.5 text-[13px] text-t3">
            {[credit.kind === 'series' ? 'Series' : 'Movie', credit.role].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {credit.score ? (
          <View className="flex-row items-center gap-1">
            <Icon name="star" size={13} color="#fff" />
            <Text className="text-[13px] font-semibold text-white">{credit.score.toFixed(1)}</Text>
          </View>
        ) : null}
        <Icon name="chevronRight" size={16} color="#6F6F6B" />
      </Pressable>
    </View>
  );
}
