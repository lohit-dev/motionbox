import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import colors from '@/constants/colors';
import { Fade } from '@/components/Fade';
import { fly } from '@/lib/motion';
import { imageUrl } from '@/lib/tmdb';
import type { Title } from '@/types';

const DURATION = 540;

/** Height of the detail hero. The flight lands on exactly this box. */
export const heroHeightFor = (screenWidth: number) => Math.min(640, screenWidth * 1.64);

interface Flight {
  title: Title;
  rect: { x: number; y: number; width: number; height: number };
  radius: number;
  /** Detail back to card, the same flight played backwards */
  reverse?: boolean;
}

interface FlightContextValue {
  /** Opens a title. Pass the card's view so the artwork can fly from it. */
  open: (title: Title, from?: View | null, radius?: number) => void;
  /** Goes back from a title. Flies the hero into the card it came from when it can. */
  close: (titleId: string) => void;
  /** True while the detail hero should stay hidden under the flying artwork */
  flying: boolean;
}

const FlightContext = createContext<FlightContextValue>({
  open: () => {},
  close: () => {},
  flying: false,
});

export const useOpenTitle = () => useContext(FlightContext).open;
export const useCloseTitle = () => useContext(FlightContext).close;
export const useFlying = () => useContext(FlightContext).flying;

export function FlightProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [landed, setLanded] = useState(false);
  /** Where the last opened title came from, so closing can fly back to it */
  const origin = useRef<Flight | null>(null);

  const open = useCallback<FlightContextValue['open']>(
    (title, from, radius = 14) => {
      const go = () => router.push({ pathname: '/title/[id]', params: { id: title.id } });
      if (!from) return go();
      from.measureInWindow((x, y, width, height) => {
        if (!width || !height) return go();
        const next = { title, rect: { x, y, width, height }, radius };
        origin.current = next;
        setLanded(false);
        setFlight(next);
        go();
      });
    },
    [router]
  );

  const close = useCallback<FlightContextValue['close']>(
    (titleId) => {
      const o = origin.current;
      if (o && o.title.id === titleId) {
        setLanded(true);
        setFlight({ ...o, reverse: true });
      }
      router.back();
    },
    [router]
  );

  // The real hero takes over at 60% of the flight, hidden underneath until then.
  useEffect(() => {
    if (!flight || flight.reverse) return;
    const t = setTimeout(() => setLanded(true), DURATION * 0.6);
    return () => clearTimeout(t);
  }, [flight]);

  const value = useMemo(
    () => ({ open, close, flying: !!flight && !flight.reverse && !landed }),
    [open, close, flight, landed]
  );

  return (
    <FlightContext.Provider value={value}>
      {children}
      {flight ? <Overlay flight={flight} onDone={() => setFlight(null)} /> : null}
    </FlightContext.Provider>
  );
}

function Overlay({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const { width } = useWindowDimensions();
  const target = { x: 0, y: 0, width, height: heroHeightFor(width), radius: 0 };
  const reverse = !!flight.reverse;
  const p = useSharedValue(reverse ? 1 : 0);
  const uri = imageUrl(flight.title.posterPath, 'w780');
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    p.value = withTiming(reverse ? 0 : 1, { duration: DURATION, easing: fly });
    const t = setTimeout(() => done.current(), DURATION + 30);
    return () => clearTimeout(t);
  }, [p, reverse]);

  const box = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [flight.rect.x, target.x]),
    top: interpolate(p.value, [0, 1], [flight.rect.y, target.y]),
    width: interpolate(p.value, [0, 1], [flight.rect.width, target.width]),
    height: interpolate(p.value, [0, 1], [flight.rect.height, target.height]),
    borderRadius: interpolate(p.value, [0, 1], [flight.radius, target.radius]),
    opacity: reverse
      ? interpolate(p.value, [0, 0.26, 1], [0, 1, 1], 'clamp')
      : interpolate(p.value, [0, 0.74, 1], [1, 1, 0], 'clamp'),
  }));
  const gradient = useAnimatedStyle(() => ({ opacity: p.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', overflow: 'hidden', backgroundColor: colors.s1 }, box]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.s2 }]} />
      )}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gradient]}>
        <Fade />
      </Animated.View>
    </Animated.View>
  );
}
