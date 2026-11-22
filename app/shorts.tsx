import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PosterArt } from '@/components/PosterArt';
import { TitleLogo } from '@/components/TitleLogo';
import { Chip } from '@/components/ui/Chip';
import { CircleButton } from '@/components/ui/CircleButton';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { useTitle } from '@/hooks/useTitle';
import { genreLine, hasScore } from '@/lib/format';
import { openTitle } from '@/lib/flight';
import { shareTitle } from '@/lib/share';
import { resolveStream } from '@/lib/youtube';
import { useApp, useHasReminder, useIsSaved } from '@/store/store';
import type { Title } from '@/types';

/** Pictures-only pages stay this long before the next one, like a story */
const STILL_MS = 6000;

/**
 * Trailer shorts: full-page portrait trailers you swipe up through, one title per page. The
 * Fresh trailers on Home open here. A page plays the title's trailer muted behind its details;
 * when a trailer can't be played the page shows its artwork and moves on by itself.
 */
export default function Shorts() {
  const { ids, start } = useLocalSearchParams<{ ids: string; start?: string }>();
  const router = useRouter();
  const { height } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const saved = useApp((s) => s.saved);
  const [tab, setTab] = useState<'new' | 'saved'>('new');
  const [index, setIndex] = useState(Number(start) || 0);
  const list = useRef<FlatList<string>>(null);
  const progress = useSharedValue(0);

  const fresh = useMemo(() => (ids ?? '').split(',').filter(Boolean), [ids]);
  const feed = tab === 'new' ? fresh : saved;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const go = useCallback(
    (next: number) => {
      if (next >= feed.length) return router.canGoBack() ? router.back() : undefined;
      list.current?.scrollToIndex({ index: next, animated: true });
    },
    [feed.length, router]
  );

  const switchTab = (next: 'new' | 'saved') => {
    setTab(next);
    setIndex(0);
    progress.value = 0;
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const renderItem = useCallback(
    ({ item, index: i }: { item: string; index: number }) => (
      <Page
        id={item}
        height={height}
        top={top}
        active={i === index}
        progress={progress}
        onDone={() => go(i + 1)}
      />
    ),
    [height, top, index, progress, go]
  );

  return (
    <View className="flex-1 bg-black">
      {feed.length ? (
        <FlatList
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
              progress.value = 0;
              setIndex(next);
            }
          }}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-center text-xl font-bold text-white">Nothing saved yet</Text>
          <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
            Save a title and its trailer shows up here.
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
          <CircleButton icon="close" label="Close" size={40} tone="glass" onPress={close} />
        </View>
      </View>
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
          style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }}>
          {i < index ? (
            <View style={{ height: 3, borderRadius: 2, backgroundColor: '#fff' }} />
          ) : i === index ? (
            <Animated.View style={[{ height: 3, borderRadius: 2, backgroundColor: '#fff' }, fill]} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

interface PageProps {
  id: string;
  height: number;
  top: number;
  active: boolean;
  progress: SharedValue<number>;
  onDone: () => void;
}

function Page({ id, height, top, active, progress, onDone }: PageProps) {
  const { title } = useTitle(id);
  const saved = useIsSaved(id);
  const reminded = useHasReminder(id);
  const toggleSave = useApp((s) => s.toggleSave);
  const toggleReminder = useApp((s) => s.toggleReminder);

  if (!title) return <View style={{ height, backgroundColor: '#000' }} />;

  return (
    <View style={{ height, backgroundColor: '#000' }}>
      <PosterFill title={title} height={height} />
      {active ? <Trailer title={title} progress={progress} onDone={onDone} /> : null}

      {/* Light at the top for the bar, heavy at the bottom for the words */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.2, backgroundColor: 'rgba(0,0,0,0.4)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.52, backgroundColor: 'rgba(11,11,10,0.55)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.3, backgroundColor: 'rgba(11,11,10,0.8)' }}
      />

      <View className="absolute right-4 items-center gap-5" style={{ bottom: 150 }}>
        <Action label="Save">
          <CircleButton
            icon={saved ? 'check' : 'plus'}
            label="Save"
            size={48}
            tone="glass"
            active={saved}
            onPress={() => toggleSave(id)}
          />
        </Action>
        <Action label="Remind">
          <CircleButton
            icon="bell"
            label="Remind me"
            size={48}
            tone="glass"
            active={reminded}
            onPress={() => toggleReminder(id)}
          />
        </Action>
        <Action label="Share">
          <CircleButton
            icon="share"
            label="Share"
            size={48}
            tone="glass"
            onPress={() => shareTitle(title)}
          />
        </Action>
      </View>

      <View className="absolute left-5 right-[84px]" style={{ bottom: Math.max(42, top - 6) }}>
        <View style={{ alignItems: 'flex-start' }}>
          <TitleLogo title={title} maxWidth={250} maxHeight={84} fontSize={44} />
        </View>
        <Text className="mt-2.5 text-[14px] font-medium text-white">
          {[hasScore(title) ? `★ ${title.score.toFixed(1)}` : '', genreLine(title, 3)]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>
        {title.tagline || title.story ? (
          <Text numberOfLines={2} className="mb-4 mt-2.5 text-[14px] leading-[20px] text-t2">
            {title.tagline || title.story}
          </Text>
        ) : (
          <View className="h-4" />
        )}
        <Pill title="View details" onPress={() => openTitle(title)} />
      </View>
    </View>
  );
}

const Action = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View className="items-center">
    {children}
    <Text className="mt-1.5 text-[12px] font-medium text-white">{label}</Text>
  </View>
);

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
 * Plays the title's trailer muted behind the page and feeds the top bar. If there is no trailer,
 * or it can't be played, the bar runs on a timer instead and the page just shows its artwork.
 */
function Trailer({
  title,
  progress,
  onDone,
}: {
  title: Title;
  progress: SharedValue<number>;
  onDone: () => void;
}) {
  const { title: full } = useTitle(title.id);
  const key = (full ?? title).clips?.find((c) => c.key)?.key;
  const detailed = !!full?.detailed;
  const [source, setSource] = useState<{ uri: string; hls: boolean } | null>(null);
  const [giveUp, setGiveUp] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // The clips only arrive with the detail
    if (!detailed && !giveUp) return;
    if (!key) return setGiveUp(true);
    let live = true;
    resolveStream(key)
      .then((s) => live && setSource({ uri: s.uri, hls: s.hls }))
      .catch(() => live && setGiveUp(true));
    return () => {
      live = false;
    };
  }, [key, detailed, giveUp]);

  const player = useVideoPlayer(
    source ? { uri: source.uri, contentType: source.hls ? 'hls' : 'progressive' } : null,
    (p) => {
      p.muted = true;
      p.timeUpdateEventInterval = 0.25;
      p.play();
    }
  );

  useEffect(() => {
    const time = player.addListener('timeUpdate', (e) => {
      if (player.duration > 0) progress.value = e.currentTime / player.duration;
      if (e.currentTime > 0) setShown(true);
    });
    const end = player.addListener('playToEnd', onDone);
    const status = player.addListener('statusChange', ({ status: s }) => {
      if (s === 'error') setGiveUp(true);
    });
    return () => {
      time.remove();
      end.remove();
      status.remove();
    };
  }, [player, progress, onDone]);

  // No video: the bar fills over a few seconds, then the next page
  useEffect(() => {
    if (!giveUp) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: STILL_MS, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
    return () => cancelAnimation(progress);
  }, [giveUp, progress, onDone]);

  if (!source || giveUp) return null;
  return (
    <View style={{ ...fill, opacity: shown ? 1 : 0 }} pointerEvents="none">
      <VideoView
        player={player}
        style={fill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

const fill = { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 } as const;
