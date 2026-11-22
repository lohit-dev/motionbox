import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Scrubber } from '@/components/Scrubber';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { Text } from '@/components/ui/Text';
import { clock, genreLine } from '@/lib/format';
import { findByClip } from '@/lib/titles';
import { useApp, useIsSaved } from '@/store/store';
import { openOnYouTube } from '@/lib/trailer';
import { resolveStream } from '@/lib/youtube';

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; uri: string; hls: boolean }
  | { phase: 'failed'; reason?: string };

/** Full-screen trailer player. Plays the clip with expo-video and falls back to YouTube if it can't. */
export default function Player() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    resolveStream(key)
      .then((stream) => live && setState({ phase: 'ready', uri: stream.uri, hls: stream.hls }))
      .catch((error) => {
        if (__DEV__) {
          console.error('[youtube] stream resolution failed', {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            error,
          });
        }
        if (live) setState({ phase: 'failed', reason: String(error?.message ?? error) });
      });
    return () => {
      live = false;
    };
  }, [key, attempt]);

  const player = useVideoPlayer(
    state.phase === 'ready'
      ? { uri: state.uri, contentType: state.hls ? 'hls' : 'progressive' }
      : null,
    (p) => p.play()
  );

  // A stream that resolves but won't decode still ends up on the fallback screen
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
        if (__DEV__) console.error('[youtube] Expo Video playback failed', error);
        setState({ phase: 'failed', reason: 'The player could not decode the stream' });
      }
    });
    return () => sub.remove();
  }, [player]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  // What is playing, for the details under the video
  const title = findByClip(key);
  const clip = title?.clips?.find((c) => c.key === key);
  const saved = useIsSaved(title?.id ?? '');
  const toggleSave = useApp((s) => s.toggleSave);
  const view = useRef<VideoView>(null);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState({ time: 0, total: 0, loaded: 0 });
  const [controls, setControls] = useState(true);

  useEffect(() => {
    player.timeUpdateEventInterval = 0.25;
    const time = player.addListener('timeUpdate', (e) =>
      setPos({ time: e.currentTime, total: player.duration, loaded: e.bufferedPosition })
    );
    const play = player.addListener('playingChange', (e) => setPlaying(e.isPlaying));
    return () => {
      time.remove();
      play.remove();
    };
  }, [player]);

  const started = pos.time > 0;

  // Controls fade away a few seconds into playback; a tap on the video brings them back
  useEffect(() => {
    if (!controls || !playing) return;
    const t = setTimeout(() => setControls(false), 3500);
    return () => clearTimeout(t);
  }, [controls, playing, started]);

  const seekBy = (s: number) => {
    player.seekBy(s);
    setControls(true);
  };
  const ready = state.phase === 'ready';
  const left = Math.max(0, pos.total - pos.time);

  const goToDetails = () => {
    if (title) router.replace({ pathname: '/title/[id]', params: { id: title.id } });
  };
  const playClip = (k?: string) => {
    if (!k || k === key) return;
    setState({ phase: 'loading' });
    router.setParams({ key: k });
  };

  return (
    <View className="flex-1 bg-ink">
      <View style={{ height: 360, backgroundColor: '#000', overflow: 'hidden' }}>
        {ready ? (
          <>
            <VideoView
              ref={view}
              player={player}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              contentFit="contain"
              nativeControls={false}
              allowsPictureInPicture
            />
            <Pressable
              accessibilityLabel="Show controls"
              scale={1}
              onPress={() => setControls((c) => !c)}
              style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
            />
          </>
        ) : state.phase === 'loading' ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center">
        <View className="items-center px-10">
          <Text className="text-center text-xl font-bold text-white">
            Can&apos;t play this here
          </Text>
          <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
            The trailer didn&apos;t load in the app. You can try again or watch it on YouTube.
          </Text>
          {__DEV__ && state.reason ? (
            <Text className="mt-3 text-center text-[11px] leading-4 text-t3">{state.reason}</Text>
          ) : null}
          <View className="mt-6 flex-row gap-3">
            <Pill
              title="Try again"
              tone="ghost"
              onPress={() => {
                setState({ phase: 'loading' });
                setAttempt((n) => n + 1);
              }}
            />
            <Pill title="Open YouTube" icon="play" onPress={() => openOnYouTube(key)} />
          </View>
        </View>
          </View>
        )}

        <View
          pointerEvents={controls || !ready ? 'box-none' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            opacity: controls || !ready ? 1 : 0,
          }}>
          <View
            pointerEvents="box-none"
            className="absolute left-4 right-4 flex-row items-center justify-between"
            style={{ top: top + 8 }}>
            <CircleButton icon="chevronDown" label="Close" size={40} tone="glass" onPress={close} />
            <View className="flex-row gap-2">
              {title ? (
                <CircleButton
                  icon="bookmark"
                  label="Save"
                  size={40}
                  tone="glass"
                  active={saved}
                  onPress={() => toggleSave(title.id)}
                />
              ) : null}
              <CircleButton
                icon="share"
                label="Share"
                size={40}
                tone="glass"
                onPress={() => Share.share({ message: `${title?.name ?? 'Trailer'} on Motion Box` })}
              />
              {ready ? (
                <CircleButton
                  icon="fullscreen"
                  label="Fullscreen"
                  size={40}
                  tone="glass"
                  onPress={() => view.current?.enterFullscreen()}
                />
              ) : null}
            </View>
          </View>

          {ready ? (
            <>
              <View
                pointerEvents="box-none"
                className="absolute left-0 right-0 flex-row items-center justify-center gap-10"
                style={{ top: 150 }}>
                <Pressable accessibilityLabel="Back 10 seconds" onPress={() => seekBy(-10)}>
                  <Icon name="replay10" size={30} />
                </Pressable>
                <Pressable
                  accessibilityLabel={playing ? 'Pause' : 'Play'}
                  scale={0.94}
                  onPress={() => {
                    if (playing) player.pause();
                    else player.play();
                    setControls(true);
                  }}
                  className="h-16 w-16 items-center justify-center rounded-full bg-white">
                  <Icon name={playing ? 'pause' : 'play'} size={24} color="#0B0B0A" />
                </Pressable>
                <Pressable accessibilityLabel="Forward 10 seconds" onPress={() => seekBy(10)}>
                  <Icon name="forward10" size={30} />
                </Pressable>
              </View>

              <View className="absolute bottom-3 left-5 right-5">
                <Scrubber
                  progress={pos.total ? pos.time / pos.total : 0}
                  buffered={pos.total ? pos.loaded / pos.total : 0}
                  onSeek={(f) => {
                    player.currentTime = f * pos.total;
                    setControls(true);
                  }}
                />
                <View className="mt-0.5 flex-row justify-between">
                  <Text className="text-[12px] font-medium text-white tabular-nums">
                    {clock(pos.time)}
                  </Text>
                  <Text className="text-[12px] font-medium text-t2 tabular-nums">
                    −{clock(left)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {title ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-gutter pt-5">
            <View className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 rounded-full bg-white" />
              <Text className="text-[11px] font-medium uppercase tracking-widest text-t2">
                Now playing · {clip?.title ?? 'Trailer'}
              </Text>
            </View>
            <Text className="mt-2.5 text-[30px] font-bold tracking-tighter text-white">
              {title.name}
            </Text>
            <Text className="mt-1.5 text-[12.5px] text-t3">
              {[genreLine(title), title.runtime, title.released].filter(Boolean).join(' · ')}
            </Text>
            <Pill title="View details" onPress={goToDetails} className="mt-[18px] w-full" />

            {title.clips && title.clips.length > 1 ? (
              <>
                <View className="mt-[26px] flex-row items-end justify-between pb-3">
                  <Text className="text-section font-extrabold text-white">More videos</Text>
                  <Text className="text-[12px] text-t3">{title.clips.length}</Text>
                </View>
              </>
            ) : null}
          </View>
          {title.clips && title.clips.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
              {title.clips.map((c, i) => {
                const now = c.key === key;
                return (
                  <Pressable
                    key={c.key ?? `${i}`}
                    accessibilityLabel={c.title}
                    scale={0.97}
                    onPress={() => playClip(c.key)}
                    style={{ width: 176 }}>
                    <View
                      style={{
                        width: 176,
                        height: 99,
                        borderRadius: 14,
                        overflow: 'hidden',
                        backgroundColor: '#141413',
                        borderWidth: now ? 2 : 0,
                        borderColor: '#fff',
                      }}>
                      {c.key ? (
                        <Image
                          source={{ uri: `https://img.youtube.com/vi/${c.key}/hqdefault.jpg` }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : null}
                      <View className="absolute bottom-2 right-2 rounded-[7px] bg-black/65 px-[7px] py-[3px]">
                        <Text className="text-[11px] font-medium text-white tabular-nums">
                          {c.length}
                        </Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} className="mt-[9px] text-[14.5px] font-semibold text-white">
                      {c.title}
                    </Text>
                    <Text className="mt-[3px] text-[10.5px] font-medium uppercase tracking-widest text-t3">
                      {now ? 'Playing' : 'Video'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}
