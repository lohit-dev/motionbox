import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { TitleLogo } from '@/components/TitleLogo';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { heroHeightFor } from '@/lib/flight';
import { genreLine } from '@/lib/format';
import { ease } from '@/lib/motion';
import type { Title } from '@/types';

export interface HeroSlide {
  title: Title;
  eyebrow: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  saved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpen: (title: Title, art: View | null) => void;
  onTrailer: (title: Title) => void;
  /** Milliseconds between automatic slides. 0 turns auto-rotate off. */
  interval?: number;
}

/**
 * Full-bleed hero that never runs out. The slides are laid out three times in a row and the
 * list quietly jumps back to the middle copy, so it always keeps moving forward.
 */
export function HeroCarousel({
  slides,
  saved,
  onToggleSave,
  onOpen,
  onTrailer,
  interval = 6000,
}: HeroCarouselProps) {
  const { width } = useWindowDimensions();
  const height = Math.min(heroHeightFor(width), 560);
  const n = slides.length;
  const looped = useMemo(() => [...slides, ...slides, ...slides], [slides]);
  const list = useRef<Animated.FlatList<HeroSlide>>(null);
  /** Position in the tripled list */
  const raw = useRef(n);
  const [index, setIndex] = useState(0);
  const touching = useRef(false);
  const scrollX = useSharedValue(n * width);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const settle = useCallback(
    (position: number) => {
      raw.current = position;
      setIndex(position % n);
      // Past the first or last copy: jump to the same slide in the middle copy, no animation
      if (position < n || position >= n * 2) {
        const middle = (position % n) + n;
        raw.current = middle;
        list.current?.scrollToIndex({ index: middle, animated: false });
      }
    },
    [n]
  );

  useEffect(() => {
    if (!interval || n < 2) return;
    const id = setInterval(() => {
      if (touching.current) return;
      list.current?.scrollToIndex({ index: raw.current + 1, animated: true });
    }, interval);
    return () => clearInterval(id);
  }, [interval, n]);

  if (!n) return <View style={{ height }} />;

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    touching.current = false;
    settle(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height }}>
      <Animated.FlatList
        ref={list}
        horizontal
        pagingEnabled
        data={looped}
        keyExtractor={(s, i) => `${i}-${s.title.id}`}
        initialScrollIndex={n}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={3}
        windowSize={3}
        onScrollBeginDrag={() => {
          touching.current = true;
        }}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item, index: i }) => (
          <Slide
            item={item}
            i={i}
            width={width}
            height={height}
            scrollX={scrollX}
            on={i % n === index}
            saved={saved(item.title.id)}
            onToggleSave={onToggleSave}
            onOpen={(art) => onOpen(item.title, art)}
            onTrailer={() => onTrailer(item.title)}
          />
        )}
      />
      <View
        pointerEvents="none"
        className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
        {slides.map((s, i) => (
          <View
            key={s.title.id}
            className={`h-1.5 rounded-full ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/35'}`}
          />
        ))}
      </View>
    </View>
  );
}

interface SlideProps {
  item: HeroSlide;
  i: number;
  width: number;
  height: number;
  scrollX: SharedValue<number>;
  /** The slide currently centred: its text rises in, one line after another */
  on: boolean;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onOpen: (art: View | null) => void;
  onTrailer: () => void;
}

/** Rise used for every line of hero text: same offset and 70ms step as the HTML design. */
const rise = (k: number) =>
  FadeInDown.delay(120 + k * 70)
    .duration(640)
    .easing(ease);

const Slide = memo(function Slide({
  item,
  i,
  width,
  height,
  scrollX,
  on,
  saved,
  onToggleSave,
  onOpen,
  onTrailer,
}: SlideProps) {
  const art = useRef<View>(null);
  const { title } = item;

  // Artwork drifts slower than the page and the text fades out before it leaves, which reads as
  // the cross-fade of the HTML hero while the carousel keeps its swipe
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
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollX.value,
      [(i - 0.6) * width, i * width, (i + 0.6) * width],
      [0, 1, 0]
    ),
  }));

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      <Animated.View ref={art} collapsable={false} style={[{ width, height }, artStyle]}>
        <PosterArt
          title={title}
          textless
          width={width}
          height={height}
          radius={0}
          size="w1280"
          bordered={false}
        />
      </Animated.View>
      <Fade />
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 34,
            alignItems: 'center',
            paddingHorizontal: 20,
          },
          textStyle,
        ]}>
        {on ? (
          <>
            <Animated.Text
              key={`e-${i}`}
              entering={rise(0)}
              className="text-eyebrow font-semibold uppercase text-t2">
              {item.eyebrow}
            </Animated.Text>
            <Animated.View key={`l-${i}`} entering={rise(1)} className="w-full">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open ${title.name}`}
                onPress={() => onOpen(art.current)}
                className="mt-3 w-full items-center justify-center"
                style={{ minHeight: 64 }}>
                <TitleLogo title={title} maxWidth={width * 0.78} maxHeight={96} fontSize={42} />
              </Pressable>
            </Animated.View>
            <Animated.View
              key={`m-${i}`}
              entering={rise(2)}
              className="mt-2 flex-row items-center gap-2.5">
              <View className="flex-row items-center gap-1">
                <Icon name="star" size={12} />
                <Text className="text-[13px] font-semibold text-white">
                  {title.score.toFixed(1)}
                </Text>
              </View>
              {title.runtime ? <Text className="text-[13px] text-t2">{title.runtime}</Text> : null}
              {title.rating ? (
                <View className="rounded border border-white/30 px-1.5 py-px">
                  <Text className="text-[10.5px] font-semibold text-t2">{title.rating}</Text>
                </View>
              ) : null}
            </Animated.View>
            <Animated.Text key={`g-${i}`} entering={rise(3)} className="mt-1 text-[13px] text-t2">
              {genreLine(title, 2)}
            </Animated.Text>
            <Animated.View
              key={`a-${i}`}
              entering={rise(4)}
              className="mt-5 flex-row items-center gap-3">
              <CircleButton
                label={saved ? 'Remove from list' : 'Save to list'}
                active={saved}
                onPress={() => onToggleSave(title.id)}>
                <Icon
                  name={saved ? 'check' : 'plus'}
                  size={20}
                  color={saved ? '#0B0B0A' : '#fff'}
                />
              </CircleButton>
              <Pill title="Watch trailer" icon="play" onPress={onTrailer} />
              <CircleButton label="Details" onPress={() => onOpen(art.current)}>
                <Icon name="info" size={20} />
              </CircleButton>
            </Animated.View>
          </>
        ) : null}
      </Animated.View>
    </View>
  );
});
