import { useId } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { imageUrl, type PosterSize } from '@/lib/tmdb';
import type { Title } from '@/types';

interface PosterArtProps {
  title: Pick<Title, 'name' | 'posterPath'>;
  width: number;
  height: number;
  radius?: number;
  size?: PosterSize;
  /** Hairline border, off for full-bleed heroes */
  bordered?: boolean;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

function hsl(h: number, s: number, l: number) {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Deterministic dark duotone per title, used until real artwork exists. */
function palette(name: string) {
  const h = hash(name) % 360;
  return { a: hsl(h, 34, 30), b: hsl((h + 28) % 360, 40, 9), glow: hsl((h + 12) % 360, 55, 46) };
}

function GeneratedArt({ name, width, height }: { name: string; width: number; height: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const p = palette(name);
  const big = width >= 120;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0.7" y2="1">
            <Stop offset={0} stopColor={p.a} />
            <Stop offset={1} stopColor={p.b} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
        <Circle
          cx={width * 0.78}
          cy={height * 0.26}
          r={width * 0.55}
          fill={p.glow}
          opacity={0.16}
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text
          allowFontScaling={false}
          className="font-extrabold text-white/15"
          style={{ fontSize: Math.min(width, height) * (big ? 0.62 : 0.8) }}>
          {name.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      {big && height <= 280 ? (
        <View className="absolute inset-x-0 bottom-0 p-2.5">
          <Text numberOfLines={2} className="text-[13px] font-bold leading-4 text-white">
            {name}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Poster image, falling back to generated artwork until a real poster is available. */
export function PosterArt({
  title,
  width,
  height,
  radius = 14,
  size = 'w500',
  bordered = true,
}: PosterArtProps) {
  const uri = imageUrl(title.posterPath, size);
  return (
    <View
      className={`overflow-hidden bg-s1 ${bordered ? 'border border-white/10' : ''}`}
      style={{ width, height, borderRadius: radius }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <GeneratedArt name={title.name} width={width} height={height} />
      )}
    </View>
  );
}
