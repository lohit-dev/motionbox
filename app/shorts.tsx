import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable as NativePressable,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fade } from '@/components/Fade';
import { ActionSheet } from '@/components/ActionSheet';
import { PosterArt } from '@/components/PosterArt';
import { TitleLogo } from '@/components/TitleLogo';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import colors from '@/constants/colors';
import { useTitle } from '@/hooks/useTitle';
import { genreLine, hasScore } from '@/lib/format';
import { openTitle } from '@/lib/flight';
import { shareTitle } from '@/lib/share';
import {
  PortraitStreamUnavailableError,
  qualityHeight,
  resolveStream,
  streamQualities,
  type StreamQuality,
} from '@/lib/youtube';
import { setVideoQuality } from '@/lib/video';
import { useApp, useHasReminder, useIsShortSaved } from '@/store/store';
import type { Title } from '@/types';

/**
 * Trailer shorts: full-page portrait clips you swipe up through, one title per page. Landscape
 * trailers are filtered out; a title without a portrait clip stays on its artwork.
 */
export default function Shorts() {
  const { ids, start } = useLocalSearchParams<{ ids: string; start?: string }>();
  const router = useRouter();
  const focused = usePathname() === '/shorts';
  const { height } = useWindowDimensions();
  const { top, bottom } = useSafeAreaInsets();
  const saved = useApp((s) => s.shortsSaved);
  const [tab, setTab] = useState<'new' | 'saved'>('new');
  const [indices, setIndices] = useState(() => ({ new: Number(start) || 0, saved: 0 }));
  const index = indices[tab];
  const [paused, setPaused] = useState(false);
  const [quality, setQuality] = useState<StreamQuality>('auto');
  const [qualityOptionsById, setQualityOptionsById] = useState<Record<string, StreamQuality[]>>({});
  const [excludedIds, setExcludedIds] = useState<Set<string>>(() => new Set());
  const [qualityOpen, setQualityOpen] = useState(false);
  const list = useRef<FlatList<string>>(null);
  const progress = useSharedValue(0);

  const fresh = useMemo(() => (ids ?? '').split(',').filter(Boolean), [ids]);
  const allFeed = tab === 'new' ? fresh : saved;
  const feed = allFeed.filter((id) => !excludedIds.has(id));

  const updateQualityOptions = useCallback((id: string, available: StreamQuality[]) => {
    const options: StreamQuality[] = ['auto', ...available.filter((value) => value !== 'auto')];
    setQualityOptionsById((current) => ({ ...current, [id]: options }));
    setQuality((current) => {
      if (options.includes(current)) return current;
      const requestedHeight = qualityHeight(current);
      const availableLevels = available
        .map((value) => ({ value, height: qualityHeight(value) }))
        .filter((entry): entry is { value: StreamQuality; height: number } => !!entry.height)
        .sort((a, b) => a.height - b.height);
      if (!availableLevels.length) return 'auto';
      return (
        availableLevels.filter((entry) => entry.height <= (requestedHeight ?? 0)).at(-1)?.value ??
        availableLevels[0].value
      );
    });
  }, []);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const go = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= feed.length) return router.canGoBack() ? router.back() : undefined;
      list.current?.scrollToIndex({ index: next, animated: true });
    },
    [feed.length, router]
  );

  const switchTab = (next: 'new' | 'saved') => {
    setTab(next);
    setPaused(false);
  };

  const skipWithoutPortrait = useCallback(
    (id: string) => {
      const nextExcluded = new Set(excludedIds).add(id);
      setExcludedIds(nextExcluded);
      progress.set(0);
      setIndices((current) => {
        if (allFeed[current[tab]] !== id) return current;
        const remaining = allFeed.filter((candidate) => !nextExcluded.has(candidate)).length;
        return {
          ...current,
          [tab]: Math.min(current[tab], Math.max(remaining - 1, 0)),
        };
      });
    },
    [allFeed, excludedIds, progress, tab]
  );

  const renderItem = useCallback(
    ({ item, index: i }: { item: string; index: number }) => (
      <Page
        id={item}
        height={height}
        bottomInset={bottom}
        quality={quality}
        onQualityOptionsChange={(options) => updateQualityOptions(item, options)}
        onNoPortrait={skipWithoutPortrait}
        active={focused && i === index}
        paused={paused}
        progress={progress}
        onDone={() => go(i + 1)}
        onTogglePaused={() => setPaused((value) => !value)}
      />
    ),
    [
      height,
      bottom,
      quality,
      updateQualityOptions,
      skipWithoutPortrait,
      index,
      paused,
      progress,
      go,
      focused,
    ]
  );

  return (
    <View className="flex-1 bg-black">
      {feed.length ? (
        <FlatList
          key={tab}
          ref={list}
          data={feed}
          extraData={index}
          keyExtractor={(id) => `${tab}-${id}`}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.min(index, Math.max(0, feed.length - 1))}
          getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          removeClippedSubviews={false}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.y / height);
            if (next !== index) {
              progress.set(0);
              setPaused(false);
              setIndices((current) => ({ ...current, [tab]: next }));
            }
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-center text-xl text-white font-bold">
            {tab === 'new' ? 'No portrait clips available' : 'Nothing saved yet'}
          </Text>
          <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
            {tab === 'new'
              ? 'New Shorts appear here when portrait video clips are available.'
              : 'Save a trailer from Shorts and it will show up here.'}
          </Text>
        </View>
      )}

      {/* Top bar sits over every page */}
      <View pointerEvents="box-none" className="absolute left-4 right-4" style={{ top: top + 6 }}>
        <Bars count={feed.length} index={index} progress={progress} />
        <View pointerEvents="box-none" className="mt-3 flex-row items-center justify-between">
          <View className="flex-row gap-1.5">
            <Chip label="New" selected={tab === 'new'} onPress={() => switchTab('new')} />
            <Chip label="Saved" selected={tab === 'saved'} onPress={() => switchTab('saved')} />
          </View>
          <View className="flex-row items-center gap-2">
            {feed.length ? (
              <CircleButton
                icon="filter"
                label={`Video quality, ${quality}`}
                size={40}
                tone="glass"
                onPress={() => setQualityOpen(true)}
              />
            ) : null}
            <CircleButton icon="close" label="Close" size={40} tone="glass" onPress={close} />
          </View>
        </View>
      </View>

      <ActionSheet
        visible={qualityOpen}
        title="Video quality"
        onClose={() => setQualityOpen(false)}
        rows={(qualityOptionsById[feed[index]] ?? ['auto']).map((value) => ({
          label: value === 'auto' ? 'Auto' : value,
          icon: quality === value ? ('check' as const) : undefined,
          onPress: () => setQuality(value),
        }))}
      />
    </View>
  );
}

/** One thin bar per page: done pages are full, the current one follows the trailer */
function Bars({
  count,
  index,
  progress,
}: {
  count: number;
  index: number;
  progress: SharedValue<number>;
}) {
  const fill = useAnimatedStyle(() => ({ width: `${Math.min(1, progress.value) * 100}%` }));
  return (
    <View className="flex-row gap-1">
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.35)',
          }}>
          {i < index ? (
            <View style={{ height: 3, borderRadius: 2, backgroundColor: '#fff' }} />
          ) : i === index ? (
            <Animated.View
              style={[{ height: 3, borderRadius: 2, backgroundColor: '#fff' }, fill]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

interface PageProps {
  id: string;
  height: number;
  bottomInset: number;
  quality: StreamQuality;
  onQualityOptionsChange: (options: StreamQuality[]) => void;
  active: boolean;
  paused: boolean;
  progress: SharedValue<number>;
  onDone: () => void;
  onTogglePaused: () => void;
  onNoPortrait: (id: string) => void;
}

function Page({
  id,
  height,
  bottomInset,
  quality,
  onQualityOptionsChange,
  active,
  paused,
  progress,
  onDone,
  onTogglePaused,
  onNoPortrait,
}: PageProps) {
  const { title } = useTitle(id);
  const saved = useIsShortSaved(id);
  const reminded = useHasReminder(id);
  const toggleSave = useApp((s) => s.toggleShortSave);
  const toggleReminder = useApp((s) => s.toggleReminder);

  if (!title) return <View style={{ height, backgroundColor: '#000' }} />;

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <PosterFill title={title} height={height} />
      {active ? (
        <Trailer
          title={title}
          paused={paused}
          progress={progress}
          onDone={onDone}
          quality={quality}
          onQualityOptionsChange={onQualityOptionsChange}
          onNoPortrait={onNoPortrait}
        />
      ) : null}

      {/* Tap pauses or resumes; vertical swipes on the FlatList move between videos. */}
      <NativePressable
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Play video' : 'Pause video'}
        onPress={onTogglePaused}
        style={fill}
      />
      {paused ? (
        <View
          pointerEvents="none"
          className="absolute self-center rounded-full bg-black/55 p-5"
          style={{ top: height / 2 - 34 }}>
          <Icon name="play" size={28} color="#fff" />
        </View>
      ) : null}

      {/* Light at the top for the bar, heavy at the bottom for the words */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.2,
          opacity: 0.55,
        }}>
        <Fade from="top" hold={0.1} />
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.62 }}>
        <Fade from="bottom" />
      </View>

      {/* Words on the left, actions on the right; the last action lines up with View details */}
      <View
        className="absolute left-5 right-5 flex-row items-end gap-3"
        style={{ bottom: Math.max(24, bottomInset + 14) }}>
        <View className="flex-1">
          <View style={{ alignItems: 'flex-start' }}>
            <TitleLogo title={title} maxWidth={250} maxHeight={84} fontSize={44} />
          </View>
          <Text className="mt-3 text-[14px] text-white font-medium">
            {[hasScore(title) ? `★ ${title.score.toFixed(1)}` : '', genreLine(title, 3)]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
          {title.tagline ? (
            <Text
              numberOfLines={2}
              className="mt-3 text-xl leading-[26px] text-white font-semibold">
              {title.tagline}
            </Text>
          ) : null}
          {title.story ? (
            <Text
              numberOfLines={2}
              className={`${title.tagline ? 'mt-1.5' : 'mt-3'} text-[14px] leading-5 text-t2`}>
              {title.story}
            </Text>
          ) : null}
          <Pill title="View details" onPress={() => openTitle(title)} className="mt-5 w-full" />
        </View>

        <View className="gap-3">
          <CircleButton
            label="Save"
            size={56}
            tone="glass"
            active={saved}
            onPress={() => toggleSave(id)}>
            <Icon
              name={saved ? 'check' : 'plus'}
              size={24}
              color={saved ? colors.ink : colors.white}
            />
          </CircleButton>
          <CircleButton
            label="Remind me"
            size={56}
            tone="glass"
            active={reminded}
            onPress={() => toggleReminder(id)}>
            <Icon name="bell" size={24} color={reminded ? colors.ink : colors.white} />
          </CircleButton>
          <CircleButton label="Share" size={56} tone="glass" onPress={() => shareTitle(title)}>
            <Icon name="share" size={24} color={colors.white} />
          </CircleButton>
        </View>
      </View>
    </View>
  );
}

/** Full-bleed artwork for the page */
function PosterFill({ title, height }: { title: Title; height: number }) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0 }}>
      <PosterArt
        title={title}
        width={width}
        height={height}
        radius={0}
        bordered={false}
        size="w780"
        showName={false}
      />
    </View>
  );
}

/**
 * Plays a portrait clip behind the page and feeds the top bar. Titles with no portrait clip
 * advance as stills; a playback failure stays on its artwork until the person swipes.
 */
function Trailer({
  title,
  paused,
  progress,
  onDone,
  quality,
  onQualityOptionsChange,
  onNoPortrait,
}: {
  title: Title;
  paused: boolean;
  progress: SharedValue<number>;
  onDone: () => void;
  quality: StreamQuality;
  onQualityOptionsChange: (options: StreamQuality[]) => void;
  onNoPortrait: (id: string) => void;
}) {
  const { title: full } = useTitle(title.id);
  const markShortWatched = useApp((s) => s.markShortWatched);
  const clips = full?.clips ?? title.clips;
  const clipKeys = useMemo(
    () => clips?.flatMap((clip) => (clip.key ? [clip.key] : [])) ?? [],
    [clips]
  );
  const detailed = !!full?.detailed;
  const [source, setSource] = useState<{ uri: string; hls: boolean } | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [giveUp, setGiveUp] = useState(false);
  const [noPortrait, setNoPortrait] = useState(false);
  const [loadedUri, setLoadedUri] = useState<string | null>(null);
  const [shownUri, setShownUri] = useState<string | null>(null);
  const pausedRef = useRef(paused);
  const qualityOptionsChangeRef = useRef(onQualityOptionsChange);
  const endedUriRef = useRef<string | null>(null);
  const excludedRef = useRef(false);
  const unavailable = giveUp || noPortrait;
  const excludeNoPortrait = useCallback(() => {
    if (excludedRef.current) return;
    excludedRef.current = true;
    setNoPortrait(true);
    onNoPortrait(title.id);
  }, [onNoPortrait, title.id]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    qualityOptionsChangeRef.current = onQualityOptionsChange;
  }, [onQualityOptionsChange]);

  useEffect(() => {
    if (!detailed || clipKeys.length) return;
    excludeNoPortrait();
  }, [detailed, clipKeys.length, excludeNoPortrait]);

  useEffect(() => {
    // The clips only arrive with the detail
    if (!detailed || !clipKeys.length || giveUp || noPortrait) return;
    let live = true;
    const findPortraitClip = async () => {
      for (const candidateKey of clipKeys) {
        try {
          const stream = await resolveStream(candidateKey, { quality, portraitOnly: true });
          if (!stream.width || !stream.height || stream.height <= stream.width) continue;
          if (!live) return;
          setStreamKey(candidateKey);
          qualityOptionsChangeRef.current(stream.qualities);
          setSource((current) =>
            current?.uri === stream.uri && current.hls === stream.hls
              ? current
              : { uri: stream.uri, hls: stream.hls }
          );
          return;
        } catch (error) {
          if (error instanceof PortraitStreamUnavailableError) continue;
          // A network, YouTube, or playback resolution failure is temporary; don't hide the title.
          if (live) setGiveUp(true);
          return;
        }
      }
      if (live) {
        excludeNoPortrait();
      }
    };
    findPortraitClip();
    return () => {
      live = false;
    };
  }, [clipKeys, detailed, giveUp, noPortrait, quality, excludeNoPortrait]);

  const player = useVideoPlayer(null, (p) => {
    p.muted = false;
    p.volume = 1;
    p.timeUpdateEventInterval = 0.25;
    setVideoQuality(p, quality, true);
  });

  useEffect(() => {
    if (!source || unavailable) {
      player.pause();
      return;
    }
    let live = true;
    const status = player.addListener('statusChange', ({ status: playerStatus }) => {
      if (live && playerStatus === 'error') setGiveUp(true);
    });
    player.pause();
    player
      .replaceAsync({ uri: source.uri, contentType: source.hls ? 'hls' : 'progressive' })
      .then(() => {
        if (live && !pausedRef.current) player.play();
      })
      .catch((error) => {
        if (live) setGiveUp(true);
      });
    return () => {
      live = false;
      status.remove();
      player.pause();
    };
  }, [player, source, unavailable]);

  useEffect(() => setVideoQuality(player, quality, true), [player, quality]);

  useEffect(() => {
    if (paused) player.pause();
    else if (source && !unavailable && loadedUri === source.uri) player.play();
  }, [player, paused, source, unavailable, loadedUri]);

  useEffect(() => {
    const time = player.addListener('timeUpdate', (e) => {
      if (player.duration > 0) progress.value = e.currentTime / player.duration;
    });
    return () => {
      time.remove();
    };
  }, [player, progress]);

  useEffect(() => {
    if (!source) return;
    let live = true;
    const sub = player.addListener('sourceLoad', ({ videoSource, availableVideoTracks }) => {
      const loadedUri =
        typeof videoSource === 'string'
          ? videoSource
          : videoSource && typeof videoSource === 'object'
            ? videoSource.uri
            : null;
      if (loadedUri && loadedUri !== source.uri) return;
      endedUriRef.current = null;
      const portraitTracks = availableVideoTracks.filter(
        (track) => track.isSupported !== false && track.size.height > track.size.width
      );
      if (portraitTracks.length) {
        const available = streamQualities(
          portraitTracks.map((track) => Math.min(track.size.width, track.size.height))
        );
        if (available.length) qualityOptionsChangeRef.current(available);
        setLoadedUri(source.uri);
        if (!pausedRef.current) player.play();
        return;
      }
      if (!source.hls || !streamKey) {
        setGiveUp(true);
        return;
      }
      resolveStream(streamKey, { preferDirect: true, quality, portraitOnly: true })
        .then((stream) => {
          if (
            live &&
            !stream.hls &&
            stream.width &&
            stream.height &&
            stream.height > stream.width
          ) {
            qualityOptionsChangeRef.current(stream.qualities);
            setSource((current) =>
              current?.uri === stream.uri && !current.hls
                ? current
                : { uri: stream.uri, hls: false }
            );
          } else if (live) {
            excludeNoPortrait();
          }
        })
        .catch((error) => {
          if (!live) return;
          if (error instanceof PortraitStreamUnavailableError) excludeNoPortrait();
          else setGiveUp(true);
        });
    });
    return () => {
      live = false;
      sub.remove();
    };
  }, [player, source, streamKey, quality, excludeNoPortrait]);

  useEffect(() => {
    if (!source || loadedUri !== source.uri || shownUri !== source.uri || unavailable) return;
    const end = player.addListener('playToEnd', () => {
      const duration = player.duration;
      const currentTime = player.currentTime;
      const endTolerance = Math.min(2, Math.max(0.35, duration * 0.05));
      if (
        pausedRef.current ||
        duration <= 0 ||
        currentTime < duration - endTolerance ||
        endedUriRef.current === source.uri
      ) {
        return;
      }
      endedUriRef.current = source.uri;
      onDone();
    });
    return () => end.remove();
  }, [player, source, loadedUri, shownUri, unavailable, onDone]);

  useEffect(() => {
    if (!source || loadedUri !== source.uri || shownUri === source.uri || paused || !streamKey)
      return;
    const timeout = setTimeout(() => {
      if (!source.hls) {
        setGiveUp(true);
        return;
      }
      resolveStream(streamKey, { preferDirect: true, quality, portraitOnly: true })
        .then((stream) => {
          if (stream.hls || !stream.width || !stream.height || stream.height <= stream.width)
            excludeNoPortrait();
          else {
            qualityOptionsChangeRef.current(stream.qualities);
            setSource({ uri: stream.uri, hls: false });
          }
        })
        .catch((error) => {
          if (error instanceof PortraitStreamUnavailableError) excludeNoPortrait();
          else setGiveUp(true);
        });
    }, 5000);
    return () => clearTimeout(timeout);
  }, [source, loadedUri, shownUri, paused, streamKey, quality, excludeNoPortrait]);

  if (!source || unavailable) return null;
  return (
    <View style={{ ...fill, opacity: shownUri === source.uri ? 1 : 0 }} pointerEvents="none">
      <VideoView
        player={player}
        style={fill}
        contentFit="cover"
        surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
        nativeControls={false}
        allowsPictureInPicture={false}
        onFirstFrameRender={() => {
          setShownUri(source.uri);
          markShortWatched(title.id);
        }}
      />
    </View>
  );
}

const fill = { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } as const;
