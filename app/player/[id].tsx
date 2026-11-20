import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import colors from '@/constants/colors';
import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { captions, clipsOf } from '@/data/extras';
import { getTitle } from '@/data/titles';
import { clamp, clock, parseClock } from '@/lib/format';
import { useApp, useIsSaved } from '@/store/store';

/**
 * Trailer player. Playback is simulated (a clock and captions over the artwork) so the screen
 * can be built and tuned before a video source is wired in. Swap the video block for expo-video.
 */
export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const title = getTitle(id ?? '');
  const toggleSave = useApp((s) => s.toggleSave);
  const saved = useIsSaved(id ?? '');

  const [clipIndex, setClipIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [trackWidth, setTrackWidth] = useState(1);

  const clips = title ? clipsOf(title) : [];
  const clip = clips[clipIndex];
  const duration = clip ? parseClock(clip.length) : 1;
  const ended = t >= duration;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setT((x) => {
        if (x + 0.25 >= duration) {
          setPlaying(false);
          return duration;
        }
        return x + 0.25;
      });
    }, 250);
    return () => clearInterval(timer);
  }, [playing, duration]);

  if (!title || !clip) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <Text className="text-xl font-bold text-white">Trailer not found</Text>
        <View className="mt-6">
          <Pill title="Go back" tone="ghost" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  const lines = captions[title.id] ?? [];
  const caption = lines.length
    ? lines[Math.min(lines.length - 1, Math.floor((t / duration) * lines.length))]
    : '';
  const seek = (x: number) => setT(clamp(x / trackWidth) * duration);
  const scrub = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(seek)(e.x))
    .onUpdate((e) => runOnJS(seek)(e.x));
  const pick = (i: number) => {
    setClipIndex(i);
    setT(0);
    setPlaying(true);
  };
  const toggle = () => {
    if (ended) setT(0);
    setPlaying(ended ? true : !playing);
  };

  return (
    <View className="flex-1 bg-ink">
      <View style={{ width, height: width * 0.78 + top }}>
        <PosterArt
          title={title}
          width={width}
          height={width * 0.78 + top}
          radius={0}
          size="w1280"
          bordered={false}
        />
        <Fade hold={0.3} />
        <Pressable
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          onPress={toggle}
          scale={1}
          className="absolute inset-0 items-center justify-center">
          {!playing ? (
            <View className="h-16 w-16 items-center justify-center rounded-full bg-black/55 pl-1">
              <Icon name={ended ? 'replay10' : 'play'} size={ended ? 28 : 26} />
            </View>
          ) : null}
        </Pressable>
        {caption ? (
          <Text className="absolute bottom-4 left-gutter right-gutter text-center text-[17px] font-semibold text-white">
            {caption}
          </Text>
        ) : null}
        <View className="absolute left-gutter" style={{ top: top + 8 }}>
          <CircleButton
            icon="close"
            label="Close"
            size={44}
            tone="glass"
            onPress={() => router.back()}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom + 24 }}>
        <View className="px-gutter pt-5">
          <Text className="text-eyebrow font-semibold uppercase text-t3">Now playing</Text>
          <Text className="mt-1 text-[22px] font-extrabold tracking-tight text-white">
            {title.name}
          </Text>
          <Text className="mt-0.5 text-[14px] text-t2">{clip.title}</Text>

          <GestureDetector gesture={scrub}>
            <View
              collapsable={false}
              className="mt-6 h-8 justify-center"
              onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}>
              <View className="h-1 overflow-hidden rounded-full bg-white/25">
                <View
                  style={{
                    width: `${(t / duration) * 100}%`,
                    height: 4,
                    backgroundColor: colors.white,
                  }}
                />
              </View>
              <View
                className="absolute h-3.5 w-3.5 rounded-full bg-white"
                style={{ left: clamp(t / duration) * trackWidth - 7 }}
              />
            </View>
          </GestureDetector>
          <View className="flex-row justify-between">
            <Text className="text-[12px] text-t3" style={{ fontVariant: ['tabular-nums'] }}>
              {clock(t)}
            </Text>
            <Text className="text-[12px] text-t3" style={{ fontVariant: ['tabular-nums'] }}>
              -{clock(duration - t)}
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-center gap-8">
            <Pressable
              accessibilityLabel="Back 10 seconds"
              scale={0.88}
              onPress={() => setT((x) => clamp(x - 10, 0, duration))}>
              <Icon name="replay10" size={30} />
            </Pressable>
            <Pressable
              accessibilityLabel={playing ? 'Pause' : 'Play'}
              scale={0.92}
              onPress={toggle}
              className="h-16 w-16 items-center justify-center rounded-full bg-white">
              <Icon
                name={playing ? 'pause' : ended ? 'replay10' : 'play'}
                size={26}
                color={colors.ink}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="Forward 10 seconds"
              scale={0.88}
              onPress={() => setT((x) => clamp(x + 10, 0, duration))}>
              <Icon name="forward10" size={30} />
            </Pressable>
          </View>

          <View className="mt-6 flex-row gap-3">
            <Pill
              title={saved ? 'Saved' : 'Save to list'}
              icon={saved ? 'check' : 'plus'}
              tone={saved ? 'ghost' : 'primary'}
              className="flex-1"
              onPress={() => toggleSave(title.id)}
            />
            <Pill
              title="Details"
              tone="ghost"
              className="flex-1"
              onPress={() => router.replace({ pathname: '/title/[id]', params: { id: title.id } })}
            />
          </View>

          <Text className="mb-1 mt-8 text-eyebrow font-semibold uppercase text-t3">Up next</Text>
          {clips.map((c, i) => (
            <Pressable
              key={c.title}
              accessibilityRole="button"
              scale={0.98}
              onPress={() => pick(i)}
              className="flex-row items-center gap-3 py-2.5">
              <View>
                <PosterArt title={title} width={120} height={68} radius={12} size="w342" />
                {i === clipIndex ? (
                  <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/55">
                    <Icon name="play" size={14} />
                  </View>
                ) : null}
              </View>
              <View className="flex-1">
                <Text numberOfLines={1} className="text-[15px] font-semibold text-white">
                  {c.title}
                </Text>
                <Text className="mt-0.5 text-[12.5px] text-t3">{c.length}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
