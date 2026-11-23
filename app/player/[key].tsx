import * as ScreenOrientation from 'expo-screen-orientation';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fade } from '@/components/Fade';
import { Scrubber } from '@/components/Scrubber';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { Text } from '@/components/ui/Text';
import { clock, genreLine } from '@/lib/format';
import { shareTitle } from '@/lib/share';
import { findByClip } from '@/lib/titles';
import { useApp, useIsSaved } from '@/store/store';
import { openOnYouTube } from '@/lib/trailer';
import { resolveStream } from '@/lib/youtube';
import { setVideoQuality } from '@/lib/video';

type State =
  | { phase: 'loading' }
  | { phase: 'ready'; uri: string; hls: boolean }
  | { phase: 'failed'; reason?: string };

const SPEEDS = [1, 1.25, 1.5, 2, 0.5] as const;
const FULLSCREEN_VIDEO_CONTAINER = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 10,
  elevation: 10,
  backgroundColor: '#000',
  overflow: 'hidden',
} as const;

/** Full-screen trailer player. Plays the clip with expo-video and falls back to YouTube if it can't. */
export default function Player() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const { top, left: insetL, right: insetR, bottom: insetB } = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [loadedSourceKey, setLoadedSourceKey] = useState<string | null>(null);
  const [firstFrameSourceKey, setFirstFrameSourceKey] = useState<string | null>(null);
  const playingRef = useRef(true);

  useEffect(() => {
    let live = true;
    resolveStream(key)
      .then((stream) => live && setState({ phase: 'ready', uri: stream.uri, hls: stream.hls }))
      .catch((error) => {
        if (__DEV__)
          console.error('[youtube] stream resolution failed:', String(error?.message ?? error));
        if (live) setState({ phase: 'failed', reason: String(error?.message ?? error) });
      });
    return () => {
      live = false;
    };
  }, [key, attempt]);

  const player = useVideoPlayer(null, (p) => {
    p.timeUpdateEventInterval = 0.5;
    setVideoQuality(p, 'auto');
  });
  const sourceUri = state.phase === 'ready' ? state.uri : null;
  const sourceHls = state.phase === 'ready' && state.hls;
  const sourceKey = sourceUri ? `${key}:${attempt}:${sourceUri}` : null;

  useEffect(() => {
    if (!sourceUri) {
      player.pause();
      return;
    }
    let live = true;
    const status = player.addListener('statusChange', ({ status: playerStatus, error }) => {
      if (playerStatus !== 'error' || !live) return;
      if (__DEV__) console.error('[video] playback failed:', String(error?.message ?? error));
      setState({ phase: 'failed', reason: 'The player could not decode the stream' });
    });
    player.pause();
    player
      .replaceAsync({ uri: sourceUri, contentType: sourceHls ? 'hls' : 'progressive' })
      .then(() => {
        if (live && playingRef.current) player.play();
      })
      .catch((error) => {
        if (live) setState({ phase: 'failed', reason: 'The stream could not be loaded' });
      });
    return () => {
      live = false;
      status.remove();
      player.pause();
    };
  }, [player, sourceUri, sourceHls]);

  const hlsReady = !!sourceUri && sourceHls;
  useEffect(() => {
    if (!sourceUri) return;
    let live = true;
    const expectedUri = sourceUri;
    const expectedSourceKey = sourceKey;
    const sub = player.addListener('sourceLoad', ({ videoSource, availableVideoTracks }) => {
      const loadedUri =
        typeof videoSource === 'string'
          ? videoSource
          : videoSource && typeof videoSource === 'object'
            ? videoSource.uri
            : null;
      if (loadedUri && loadedUri !== expectedUri) return;
      if (availableVideoTracks.length) {
        setLoadedSourceKey(expectedSourceKey);
        if (playingRef.current) player.play();
        return;
      }
      if (!hlsReady) {
        setState({ phase: 'failed', reason: 'The stream has no video track' });
        return;
      }
      resolveStream(key, { preferDirect: true })
        .then((stream) => {
          if (live && !stream.hls) {
            setState({ phase: 'ready', uri: stream.uri, hls: false });
          }
        })
        .catch((error) => {
          if (live)
            setState({
              phase: 'failed',
              reason: String(error?.message ?? 'No playable MP4 found'),
            });
        });
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [player, hlsReady, key, sourceUri, sourceKey]);

  // A failed load is retried quietly twice before the fallback screen is left for the person
  const [retry, setRetry] = useState({ key, count: 0 });
  const auto = retry.key === key ? retry.count : 0;
  useEffect(() => {
    if (state.phase !== 'failed' || auto >= 2) return;
    const t = setTimeout(() => {
      setRetry({ key, count: auto + 1 });
      setState({ phase: 'loading' });
      setAttempt((n) => n + 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [state.phase, auto, key]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  // What is playing, for the details under the video
  const title = findByClip(key);
  const saved = useIsSaved(title?.id ?? '');
  const toggleSave = useApp((s) => s.toggleSave);
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState({ time: 0, total: 0, loaded: 0 });
  const [controls, setControls] = useState(true);
  const [fullScreen, setFullScreen] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [ended, setEnded] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastTap = useRef({ side: '', at: 0 });
  const [flash, setFlash] = useState<'back' | 'forward' | null>(null);

  // Spinner while the video waits for data, and a replay button once it has played to the end
  useEffect(() => {
    const status = player.addListener('statusChange', ({ status: s }) => setBuffering(s === 'loading'));
    const end = player.addListener('playToEnd', () => {
      setEnded(true);
      setControls(true);
    });
    const play = player.addListener('playingChange', (e) => {
      if (e.isPlaying) setEnded(false);
    });
    return () => {
      status.remove();
      end.remove();
      play.remove();
    };
  }, [player]);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!sourceUri || loadedSourceKey !== sourceKey) {
      player.pause();
      return;
    }
    if (playing) player.play();
    else player.pause();
  }, [player, playing, loadedSourceKey, sourceUri, sourceKey]);

  // Fullscreen turns the phone to landscape; leaving (or closing the player) puts it back
  useEffect(() => {
    ScreenOrientation.lockAsync(
      fullScreen
        ? ScreenOrientation.OrientationLock.LANDSCAPE
        : ScreenOrientation.OrientationLock.PORTRAIT_UP
    ).catch(() => {});
  }, [fullScreen]);
  useEffect(
    () => () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
    },
    []
  );

  useEffect(() => {
    if (!fullScreen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFullScreen(false);
      setControls(true);
      return true;
    });
    return () => subscription.remove();
  }, [fullScreen]);

  useEffect(() => {
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
  const togglePlay = () => {
    if (ended) {
      player.currentTime = 0;
      player.play();
      setEnded(false);
    } else if (playing) player.pause();
    else player.play();
    setControls(true);
  };
  // One tap shows or hides the controls; two quick taps on a side skip 10 seconds that way
  const tapSide = (side: 'back' | 'forward') => {
    const now = Date.now();
    if (lastTap.current.side === side && now - lastTap.current.at < 320) {
      lastTap.current = { side: '', at: 0 };
      player.seekBy(side === 'back' ? -10 : 10);
      setFlash(side);
      setTimeout(() => setFlash(null), 450);
      return;
    }
    lastTap.current = { side, at: now };
    setTimeout(() => {
      if (lastTap.current.side === side && lastTap.current.at === now) setControls((c) => !c);
    }, 330);
  };
  const frameTop = fullScreen ? 0 : top;
  const inlineHeight = top + Math.round((screenW * 9) / 16);
  const videoBox = { position: 'absolute', top: frameTop, bottom: 0, left: 0, right: 0 } as const;
  const ready = !!sourceUri && firstFrameSourceKey === sourceKey;
  const left = Math.max(0, pos.total - pos.time);

  const goToDetails = () => {
    if (!title) return;
    // The player is pushed from the title screen. Pop it so details appears immediately
    // and preserves the title screen's navigation state.
    if (router.canGoBack()) router.back();
    else router.replace({ pathname: '/title/[id]', params: { id: title.id } });
  };
  const playClip = (k?: string) => {
    if (!k || k === key) return;
    setState({ phase: 'loading' });
    router.setParams({ key: k });
  };

  return (
    <View className="flex-1 bg-ink">
      {Platform.OS === 'android' ? (
        <SystemBars hidden={fullScreen ? { statusBar: true, navigationBar: true } : false} />
      ) : fullScreen ? (
        <StatusBar hidden />
      ) : null}
      <View
        style={
          fullScreen
            ? FULLSCREEN_VIDEO_CONTAINER
            : { height: inlineHeight, backgroundColor: '#000', overflow: 'hidden' }
        }>
        {sourceUri ? (
          <>
            <VideoView
              player={player}
              style={videoBox}
              contentFit="contain"
              surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
              nativeControls={false}
              allowsPictureInPicture
              onFirstFrameRender={() => setFirstFrameSourceKey(sourceKey)}
            />
            {ready ? (
              <View style={[videoBox, { flexDirection: 'row' }]}>
                <Pressable
                  accessibilityLabel="Show controls, double tap to go back 10 seconds"
                  scale={1}
                  onPress={() => tapSide('back')}
                  style={{ flex: 1 }}
                />
                <Pressable
                  accessibilityLabel="Show controls, double tap to go forward 10 seconds"
                  scale={1}
                  onPress={() => tapSide('forward')}
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <View className="absolute inset-0 items-center justify-center bg-black">
                <ActivityIndicator color="#fff" size="large" />
              </View>
            )}
          </>
        ) : state.phase === 'loading' ? (
          <View className="flex-1 items-center justify-center" style={{ paddingTop: frameTop }}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : (
          <View className="flex-1 items-center justify-center" style={{ paddingTop: frameTop }}>
            <View className="items-center px-10">
              <Text className="text-center text-xl text-white font-bold">
                Can&apos;t play this here
              </Text>
              <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
                The trailer didn&apos;t load in the app. You can try again or watch it on YouTube.
              </Text>
              {__DEV__ && state.phase === 'failed' && state.reason ? (
                <Text className="mt-3 text-center text-[11px] leading-4 text-t3">
                  {state.reason}
                </Text>
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

        {flash ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: frameTop,
              bottom: 0,
              justifyContent: 'center',
              ...(flash === 'back' ? { left: '14%' } : { right: '14%' }),
            }}>
            <View className="rounded-full bg-black/55 px-4 py-2">
              <Text className="text-[14px] tabular-nums text-white font-semibold">
                {flash === 'back' ? '−10s' : '+10s'}
              </Text>
            </View>
          </View>
        ) : null}

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
          {ready ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, opacity: 0.7 }}>
                <Fade from="top" hold={0.1} />
              </View>
              <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, opacity: 0.8 }}>
                <Fade from="bottom" hold={0.1} />
              </View>
            </>
          ) : null}
          <View
            pointerEvents="box-none"
            className="absolute flex-row items-center justify-between"
            style={{
              top: fullScreen ? 12 : top + 8,
              left: Math.max(16, insetL),
              right: Math.max(16, insetR),
            }}>
            <CircleButton
              icon="chevronDown"
              label={fullScreen ? 'Exit fullscreen' : 'Close'}
              size={40}
              tone="glass"
              onPress={() => {
                if (fullScreen) {
                  setFullScreen(false);
                  setControls(true);
                } else close();
              }}
            />
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
                onPress={() => title && shareTitle(title)}
              />
              {ready ? (
                <CircleButton
                  icon="fullscreen"
                  label="Fullscreen"
                  size={40}
                  tone="glass"
                  onPress={() => {
                    setFullScreen(true);
                    setControls(true);
                  }}
                />
              ) : null}
            </View>
          </View>

          {ready ? (
            <>
              <View
                pointerEvents="box-none"
                className="absolute inset-0 flex-row items-center justify-center gap-10"
                style={{ paddingTop: frameTop }}>
                <Pressable accessibilityLabel="Back 10 seconds" onPress={() => seekBy(-10)}>
                  <Icon name="replay10" size={32} />
                </Pressable>
                <Pressable
                  accessibilityLabel={ended ? 'Replay' : playing ? 'Pause' : 'Play'}
                  scale={0.94}
                  onPress={togglePlay}
                  className="h-[68px] w-[68px] items-center justify-center rounded-full bg-white">
                  {buffering && !ended ? (
                    <ActivityIndicator color="#0B0B0A" />
                  ) : (
                    <Icon
                      name={ended ? 'replay10' : playing ? 'pause' : 'play'}
                      size={26}
                      color="#0B0B0A"
                    />
                  )}
                </Pressable>
                <Pressable accessibilityLabel="Forward 10 seconds" onPress={() => seekBy(10)}>
                  <Icon name="forward10" size={32} />
                </Pressable>
              </View>

              <View
                className="absolute"
                style={{
                  bottom: fullScreen ? Math.max(12, insetB) : 12,
                  left: Math.max(20, insetL),
                  right: Math.max(20, insetR),
                }}>
                <Scrubber
                  progress={pos.total ? pos.time / pos.total : 0}
                  buffered={pos.total ? pos.loaded / pos.total : 0}
                  onSeek={(f) => {
                    player.seekBy(f * pos.total - pos.time);
                    setControls(true);
                  }}
                />
                <View className="mt-0.5 flex-row items-center justify-between">
                  <Text className="text-[12px] tabular-nums text-white font-medium">
                    {clock(pos.time)}
                  </Text>
                  <Pressable
                    accessibilityLabel={`Playback speed ${speed} times`}
                    scale={0.94}
                    onPress={() => {
                      setSpeed((v) => SPEEDS[(SPEEDS.indexOf(v as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]);
                      setControls(true);
                    }}
                    className="rounded-full bg-white/15 px-3 py-1">
                    <Text className="text-[12px] tabular-nums text-white font-semibold">{speed}×</Text>
                  </Pressable>
                  <Text className="text-[12px] tabular-nums text-t2 font-medium">
                    −{clock(left)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>

      {!fullScreen && title ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="px-gutter pt-5">
            <Text className="text-[30px] tracking-tighter text-white font-bold">
              {title.name}
            </Text>
            <Text className="mt-1.5 text-[12.5px] text-t3">
              {[genreLine(title), title.runtime, title.released].filter(Boolean).join(' · ')}
            </Text>
            <Pill title="View details" onPress={goToDetails} className="mt-[18px] w-full" />

            {title.clips && title.clips.length > 1 ? (
              <>
                <View className="mt-[26px] flex-row items-end justify-between pb-3">
                  <Text className="text-section text-white font-extrabold">More videos</Text>
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
                      {/\d:\d\d/.test(c.length) ? (
                        <View className="absolute bottom-2 right-2 rounded-[7px] bg-black/65 px-[7px] py-[3px]">
                          <Text className="text-[11px] tabular-nums text-white font-medium">
                            {c.length}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      className="mt-[9px] text-[14.5px] text-white font-semibold">
                      {c.title}
                    </Text>
                    <Text className="mt-[3px] text-[10.5px] uppercase tracking-widest text-t3 font-medium">
                      {now ? 'Playing' : c.length || 'Video'}
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
