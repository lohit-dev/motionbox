import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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
  const list = useRef<FlatList<HeroSlide>>(null);
  const art = useRef<Record<number, View | null>>({});
  /** Position in the tripled list */
  const raw = useRef(n);
  const [index, setIndex] = useState(0);
  const touching = useRef(false);

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
      <FlatList
        ref={list}
        horizontal
        pagingEnabled
        data={looped}
        keyExtractor={(s, i) => `${i}-${s.title.id}`}
        initialScrollIndex={n}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => {
          touching.current = true;
        }}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item, index: i }) => {
          const on = i % n === index;
          const isSaved = saved(item.title.id);
          return (
            <View style={{ width, height }}>
              <View
                ref={(v) => {
                  art.current[i] = v;
                }}
                collapsable={false}
                style={{ width, height }}>
                <PosterArt
                  title={item.title}
                  width={width}
                  height={height}
                  radius={0}
                  size="w1280"
                  bordered={false}
                />
              </View>
              <Fade />
              {on ? (
                <Animated.View
                  key={`${i}-on`}
                  entering={FadeInDown.duration(620).easing(ease)}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 34,
                    alignItems: 'center',
                    paddingHorizontal: 20,
                  }}>
                  <Text className="text-eyebrow font-semibold uppercase text-t2">
                    {item.eyebrow}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${item.title.name}`}
                    onPress={() => onOpen(item.title, art.current[i] ?? null)}
                    className="mt-3 w-full items-center justify-center"
                    style={{ minHeight: 64 }}>
                    <TitleLogo
                      title={item.title}
                      maxWidth={width * 0.78}
                      maxHeight={96}
                      fontSize={42}
                    />
                  </Pressable>
                  <Text className="mt-2 text-[13px] text-t2">{genreLine(item.title, 3)}</Text>
                  <View className="mt-5 flex-row items-center gap-3">
                    <CircleButton
                      label={isSaved ? 'Remove from list' : 'Save to list'}
                      active={isSaved}
                      onPress={() => onToggleSave(item.title.id)}>
                      <Icon
                        name={isSaved ? 'check' : 'plus'}
                        size={20}
                        color={isSaved ? '#0B0B0A' : '#fff'}
                      />
                    </CircleButton>
                    <Pill title="Watch trailer" icon="play" onPress={() => onTrailer(item.title)} />
                  </View>
                </Animated.View>
              ) : null}
            </View>
          );
        }}
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
