import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Share, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Avatar } from '@/components/Avatar';
import { Fade } from '@/components/Fade';
import { Poster } from '@/components/Poster';
import { PosterArt } from '@/components/PosterArt';
import { Rail } from '@/components/Rail';
import { Reveal } from '@/components/Reveal';
import { SectionHeader } from '@/components/SectionHeader';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { getTitle } from '@/data/titles';
import { kindLine } from '@/lib/format';
import { useApp, useIsSaved } from '@/store/store';
import type { Title } from '@/types';

export default function TitleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const toggleSave = useApp((s) => s.toggleSave);
  const saved = useIsSaved(id ?? '');
  const title = getTitle(id ?? '');

  if (!title) {
    return (
      <View className="flex-1 items-center justify-center bg-ink px-8">
        <Text className="text-center text-xl font-bold text-white">Title not found</Text>
        <View className="mt-6">
          <Pill title="Go back" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const related = title.related.map((rid) => getTitle(rid)).filter((t): t is Title => !!t);
  const heroHeight = Math.min(640, width * 1.64);

  return (
    <View className="flex-1 bg-ink">
      <ScrollView showsVerticalScrollIndicator={false} bounces>
        <View style={{ width, height: heroHeight }}>
          <PosterArt
            title={title}
            width={width}
            height={heroHeight}
            radius={0}
            size="w780"
            bordered={false}
          />
          <Fade />
          <Reveal
            style={{ position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' }}>
            <Text className="text-eyebrow font-semibold uppercase text-t2">{kindLine(title)}</Text>
            <Text className="mt-2 px-gutter text-center text-[40px] font-extrabold leading-[42px] tracking-tighter text-white">
              {title.name}
            </Text>
            <View className="mt-3 flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Icon name="star" size={13} />
                <Text className="text-[13px] font-semibold text-white">
                  {title.score.toFixed(1)}
                </Text>
              </View>
              <Text className="text-[13px] text-t2">{title.runtime}</Text>
              <View className="rounded border border-white/30 px-1.5 py-0.5">
                <Text className="text-[11px] font-semibold text-t2">{title.rating}</Text>
              </View>
            </View>
          </Reveal>
        </View>

        <Reveal index={2} style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          <View className="flex-row items-center gap-3">
            <CircleButton
              label={saved ? 'Remove from list' : 'Save to list'}
              active={saved}
              onPress={() => toggleSave(title.id)}>
              <Icon
                name="bookmark"
                size={20}
                color={saved ? colors.ink : colors.white}
                filled={saved}
              />
            </CircleButton>
            <Pill title="Watch trailer" icon="play" className="flex-1" />
            <CircleButton
              icon="share"
              label="Share"
              onPress={() => Share.share({ message: `${title.name} on Motion Box` })}
            />
          </View>
          <Text className="mt-5 text-[15px] leading-6 text-t2">{title.story}</Text>
          <Text className="mt-4 text-[13px] text-t3">
            {title.genres.join(' · ')} · {title.studio} · Directed by {title.director}
          </Text>
        </Reveal>

        <SectionHeader title="Cast" />
        <Rail
          data={title.cast}
          keyExtractor={(c) => c.name}
          gap={16}
          renderItem={(c) => (
            <View className="items-center" style={{ width: 84 }}>
              <Avatar name={c.name} size={72} />
              <Text numberOfLines={1} className="mt-2 text-[12.5px] font-semibold text-white">
                {c.name}
              </Text>
              <Text className="text-[11.5px] text-t3">{c.role}</Text>
            </View>
          )}
        />

        <SectionHeader title="More like this" />
        <Rail
          data={related}
          keyExtractor={(t) => t.id}
          renderItem={(t) => (
            <Poster
              title={t}
              showScore
              onPress={(next) => router.push({ pathname: '/title/[id]', params: { id: next.id } })}
            />
          )}
        />
        <View className="h-16" />
      </ScrollView>

      <View
        className="absolute left-gutter right-gutter flex-row items-center justify-between"
        style={{ top: top + 8 }}>
        <CircleButton
          icon="back"
          label="Back"
          size={44}
          tone="glass"
          onPress={() => router.back()}
        />
        <CircleButton icon="more" label="More" size={44} tone="glass" />
      </View>
    </View>
  );
}
