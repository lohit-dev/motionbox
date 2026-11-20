import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Fade } from '@/components/Fade';
import { PosterArt } from '@/components/PosterArt';
import { CircleButton } from '@/components/ui/CircleButton';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Pressable } from '@/components/ui/Pressable';
import { heroHeightFor } from '@/lib/flight';
import { ease } from '@/lib/motion';
import { imageUrl } from '@/lib/tmdb';
import { genreLine } from '@/lib/format';
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

/** Full-bleed hero. Pages horizontally, rotates by itself, and the text rises in per slide. */
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
  const list = useRef<FlatList<HeroSlide>>(null);
  const art = useRef<Record<string, View | null>>({});
  const [index, setIndex] = useState(0);
  const touching = useRef(false);

  const go = useCallback(
    (next: number) => {
      list.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    },
    [list]
  );

  useEffect(() => {
    if (!interval) return;
    const id = setInterval(() => {
      if (!touching.current) go((index + 1) % slides.length);
    }, interval);
    return () => clearInterval(id);
  }, [index, interval, slides.length, go]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    touching.current = false;
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={{ height }}>
      <FlatList
        ref={list}
        horizontal
        pagingEnabled
        data={slides}
        keyExtractor={(s) => s.title.id}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onScrollBeginDrag={() => {
          touching.current = true;
        }}
        onMomentumScrollEnd={onEnd}
        renderItem={({ item, index: i }) => {
          const on = i === index;
          return (
            <View style={{ width, height }}>
              <View
                ref={(v) => {
                  art.current[item.title.id] = v;
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
                  key={`${item.title.id}-on`}
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
                    onPress={() => onOpen(item.title, art.current[item.title.id] ?? null)}
                    className="mt-2 h-[100px] w-full items-center justify-center">
                    {item.title.logoPath ? (
                      <Image
                        source={{ uri: imageUrl(item.title.logoPath, 'w780') ?? undefined }}
                        resizeMode="contain"
                        style={{ width: '84%', height: 100 }}
                        accessibilityLabel={item.title.name}
                      />
                    ) : (
                      <Text className="text-center text-[44px] font-extrabold leading-[46px] tracking-tighter text-white">
                        {item.title.name}
                      </Text>
                    )}
                  </Pressable>
                  <Text className="mt-2 text-[13px] text-t2">{genreLine(item.title, 3)}</Text>
                  <View className="mt-5 flex-row items-center gap-3">
                    <CircleButton
                      label={saved(item.title.id) ? 'Remove from list' : 'Save to list'}
                      active={saved(item.title.id)}
                      onPress={() => onToggleSave(item.title.id)}>
                      <Icon
                        name={saved(item.title.id) ? 'check' : 'plus'}
                        size={20}
                        color={saved(item.title.id) ? '#0B0B0A' : '#fff'}
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
