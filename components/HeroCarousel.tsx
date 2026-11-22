import { useFocusEffect } from 'expo-router';
import { memo, useCallback, useMemo, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { TitleLogo } from '@/components/TitleLogo';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { heroHeightFor } from '@/lib/flight';
import { genreLine, hasScore } from '@/lib/format';
import { useIsSaved } from '@/store/store';
import type { Title } from '@/types';

export interface HeroSlide {
  title: Title;
  eyebrow: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  onToggleSave: (id: string) => void;
  onOpen: (title: Title, tag: string) => void;
  onTrailer: (title: Title) => void;
  /** Vertical scroll offset of the page the carousel sits at the top of. Pulling past the top stretches the hero. */
  scrollY?: SharedValue<number>;
  /** Milliseconds between automatic slides. 0 turns auto-rotate off. */
  interval?: number;
}

/**
 * Full-bleed hero that never runs out. The slides are laid out three times in a row and the
 * list quietly jumps back to the middle copy, so it always keeps moving forward. Every copy
 * stays mounted (a handful of views), so the jump never lands on a slide that has not rendered.
 *
 * Nothing here is React state. The scroll position is one shared value, and the page dots, the
 * artwork drift and the rise of each line of text are all read from it on the UI thread.
 */
export function HeroCarousel({
  slides,
  onToggleSave,
  onOpen,
  onTrailer,
  scrollY,
  interval = 6000,
}: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const height = Math.min(heroHeightFor(width), 560);
  const n = slides.length;
  const looped = useMemo(() => [...slides, ...slides, ...slides], [slides]);
  const list = useRef<Animated.FlatList<HeroSlide>>(null);
  const touching = useRef(false);
  const scrollX = useSharedValue(n * width);
  const idle = useSharedValue(0);
  const pageY = scrollY ?? idle;
  // Same stretch as the title page: pulling down grows the hero by exactly the pull. Scale about
  // the centre, then lift by half, so the top follows the finger and the bottom stays put.
  const stretch = useAnimatedStyle(() => {
    const pull = Math.max(0, -pageY.value);
    return { transform: [{ translateY: -pull / 2 }, { scale: 1 + pull / height }] };
  });
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  // Auto-advance only while Home is on screen: not under a detail, not on another tab
  useFocusEffect(
    useCallback(() => {
      if (!interval || n < 2) return;
      const id = setInterval(() => {
        if (touching.current) return;
        const at = Math.round(scrollX.value / width);
        list.current?.scrollToIndex({ index: Math.min(at + 1, n * 3 - 1), animated: true });
      }, interval);
      return () => clearInterval(id);
    }, [interval, n, width, scrollX])
  );

  const onEnd = useCallback(
    (offset: number) => {
      touching.current = false;
      const at = Math.round(offset / width);
      // Past the first or last copy: jump to the same slide in the middle copy, no animation
      if (at < n || at >= n * 2) {
        list.current?.scrollToOffset({ offset: ((at % n) + n) * width, animated: false });
      }
    },
    [n, width]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: HeroSlide; index: number }) => (
      <Slide
        item={item}
        i={index}
        width={width}
        height={height}
        scrollX={scrollX}
        scrollY={pageY}
        onToggleSave={onToggleSave}
        onOpen={onOpen}
        onTrailer={onTrailer}
      />
    ),
    [width, height, scrollX, pageY, onToggleSave, onOpen, onTrailer]
  );

  if (!n) return <View style={{ height }} />;

  return (
    <View style={{ height }}>
      <Animated.View style={[{ height }, stretch]}>
        <Animated.FlatList
          ref={list}
          horizontal
          pagingEnabled
          data={looped}
          keyExtractor={keyOf}
          initialScrollIndex={n}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialNumToRender={looped.length}
          windowSize={looped.length + 1}
          removeClippedSubviews={false}
          onScrollBeginDrag={() => {
            touching.current = true;
          }}
          onMomentumScrollEnd={(e) => onEnd(e.nativeEvent.contentOffset.x)}
          renderItem={renderItem}
        />
      </Animated.View>
      <View
        pointerEvents="none"
        className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
        {slides.map((s, i) => (
          <Dot key={s.title.id} i={i} n={n} width={width} scrollX={scrollX} />
        ))}
      </View>
    </View>
  );
}

/** Gap between the bottom of the hero and its text */
const TEXT_BOTTOM = 34;

const keyOf = (s: HeroSlide, i: number) => `${i}-${s.title.id}`;

/** Page dot that widens as its slide comes to the middle, including across the loop seam */
function Dot({
  i,
  n,
  width,
  scrollX,
}: {
  i: number;
  n: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const pos = scrollX.value / width;
    const raw = Math.abs((((pos % n) + n) % n) - i);
    const d = Math.min(raw, n - raw);
    return {
      width: interpolate(d, [0, 1], [16, 6], Extrapolation.CLAMP),
      opacity: interpolate(d, [0, 1], [1, 0.35], Extrapolation.CLAMP),
    };
  });
  return <Animated.View className="h-1.5 rounded-full bg-white" style={style} />;
}

interface SlideProps {
  item: HeroSlide;
  i: number;
  width: number;
  height: number;
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  onToggleSave: (id: string) => void;
  onOpen: (title: Title, tag: string) => void;
  onTrailer: (title: Title) => void;
}

/** Rises line by line as its slide arrives: line k starts a little later than line k - 1 */
const useRise = (scrollX: SharedValue<number>, i: number, width: number, k: number) =>
  useAnimatedStyle(() => {
    // 1 when this slide is centred, 0 when it is a full page away
    const q = 1 - Math.min(Math.abs(scrollX.value - i * width) / width, 1);
    const from = 0.45 + k * 0.07;
    return {
      opacity: interpolate(q, [from, 0.95], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(q, [from, 0.95], [18, 0], Extrapolation.CLAMP) }],
    };
  });

const Slide = memo(function Slide({
  item,
  i,
  width,
  height,
  scrollX,
  scrollY,
  onToggleSave,
  onOpen,
  onTrailer,
}: SlideProps) {
  const { title } = item;
  const saved = useIsSaved(title.id);

  // Artwork drifts slower than the page, which reads as the cross-fade of the HTML hero
  // while the carousel keeps its swipe
  const artStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          [(i - 1) * width, i * width, (i + 1) * width],
          [-width * 0.2, 0, width * 0.2]
        ),
      },
    ],
  }));
  // The stretch scales everything in the hero; the text counter-scales so only the artwork grows
  const hold = useAnimatedStyle(() => {
    const pull = Math.max(0, -scrollY.value);
    const k = 1 + pull / height;
    return {
      transformOrigin: 'bottom',
      transform: [{ translateY: TEXT_BOTTOM * (k - 1) }, { scale: 1 / k }],
    };
  });
  const r0 = useRise(scrollX, i, width, 0);
  const r1 = useRise(scrollX, i, width, 1);
  const r2 = useRise(scrollX, i, width, 2);
  const r3 = useRise(scrollX, i, width, 3);
  const r4 = useRise(scrollX, i, width, 4);

  // Every slide has its own tag (the loop mounts each title three times)
  const sharedTag = `hero-${i}-${title.id}`;
  const open = () => onOpen(title, sharedTag);

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Animated.View style={[{ width, height }, artStyle]}>
        <Animated.View sharedTransitionTag={sharedTag} style={{ width, height }}>
          <PosterArt
            title={title}
            textless
            placeholder
            width={width}
            height={height}
            radius={0}
            size="w1280"
            bordered={false}
          />
        </Animated.View>
      </Animated.View>
      <Fade />
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: TEXT_BOTTOM,
            alignItems: 'center',
            paddingHorizontal: 20,
          },
          hold,
        ]}>
        <Animated.Text style={r0} className="text-eyebrow uppercase text-t2 font-semibold">
          {item.eyebrow}
        </Animated.Text>
        <Animated.View style={r1} className="w-full">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${title.name}`}
            onPress={open}
            className="mt-3 w-full items-center justify-center"
            style={{ minHeight: 64 }}>
            <TitleLogo title={title} maxWidth={width * 0.78} maxHeight={96} fontSize={42} />
          </Pressable>
        </Animated.View>
        <Animated.View style={r2} className="mt-2 flex-row items-center gap-2.5">
          {hasScore(title) ? (
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={12} />
              <Text className="text-[13px] text-white font-semibold">{title.score.toFixed(1)}</Text>
            </View>
          ) : null}
          {title.runtime ? <Text className="text-[13px] text-t2">{title.runtime}</Text> : null}
          {title.rating ? (
            <View className="rounded border border-white/30 px-1.5 py-px">
              <Text className="text-[10.5px] text-t2 font-semibold">{title.rating}</Text>
            </View>
          ) : null}
        </Animated.View>
        <Animated.Text style={r3} className="mt-1 text-[13px] text-t2 font-normal">
          {genreLine(title, 2)}
        </Animated.Text>
        <Animated.View style={r4} className="mt-5 flex-row items-center gap-3">
          <CircleButton
            label={saved ? 'Remove from list' : 'Save to list'}
            active={saved}
            tone="glass"
            onPress={() => onToggleSave(title.id)}>
            <Icon name={saved ? 'check' : 'plus'} size={20} color={saved ? '#0B0B0A' : '#fff'} />
          </CircleButton>
          <Pill title="Watch trailer" icon="play" onPress={() => onTrailer(title)} />
          <CircleButton label="Details" tone="glass" onPress={open}>
            <Icon name="info" size={20} />
          </CircleButton>
        </Animated.View>
      </Animated.View>
    </View>
  );
});
