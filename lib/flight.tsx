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
import { Image, StyleSheet, View, useWindowDimensions, type ViewInstance } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
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
  /** Where the hero sits when closing: minus the detail scroll offset */
  offsetY?: number;
}

interface FlightContextValue {
  /** Opens a title. Pass the card's view so the artwork can fly from it. */
  open: (title: Title, from?: ViewInstance | null, radius?: number) => void;
  /**
   * Goes back from a title. Flies the hero into the card it came from when it can,
   * while the detail screen fades out underneath. Pass the detail scroll offset.
   */
  close: (titleId: string, scrollOffset?: number) => void;
  /** True while artwork is flying in, so the detail screen plays its flight entrance */
  flying: boolean;
  /** 0 to 1 over the flight, 1 when idle. Drives the detail's dark page background. */
  progress: SharedValue<number>;
  /** The detail calls this once its hero is mounted, so the flying artwork can hand over to it */
  heroReady: () => void;
  /** Id of the title being closed, from close() until its screen is gone */
  closingId: string | null;
}

const FlightContext = createContext<FlightContextValue>({
  open: () => {},
  close: () => {},
  flying: false,
  progress: { value: 1 } as SharedValue<number>,
  heroReady: () => {},
  closingId: null,
});

export const useOpenTitle = () => useContext(FlightContext).open;
export const useCloseTitle = () => useContext(FlightContext).close;
export const useFlying = () => useContext(FlightContext).flying;
export const useFlightProgress = () => useContext(FlightContext).progress;
export const useHeroReady = () => useContext(FlightContext).heroReady;
/** True only for the detail that is being closed, so a detail stacked underneath stays put */
export const useClosing = (id: string) => useContext(FlightContext).closingId === id;

export function FlightProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [flight, setFlight] = useState<Flight | null>(null);
  const [landed, setLanded] = useState(false);
  const [ready, setReady] = useState(false);
  const progress = useSharedValue(1);
  const [closingId, setClosingId] = useState<string | null>(null);
  /** One entry per open detail screen, so each close flies back to its own card */
  const origins = useRef<(Flight | null)[]>([]);

  const open = useCallback<FlightContextValue['open']>(
    (title, from, radius = 14) => {
      const go = () => router.push({ pathname: '/title/[id]', params: { id: title.id } });
      if (!from) {
        origins.current.push(null);
        return go();
      }
      from.measureInWindow((x, y, w, h) => {
        if (!w || !h) {
          origins.current.push(null);
          return go();
        }
        const next = { title, rect: { x, y, width: w, height: h }, radius };
        origins.current.push(next);
        setLanded(false);
        setReady(false);
        setFlight(next);
        progress.value = 0;
        progress.value = withTiming(1, { duration: DURATION, easing: fly });
        go();
      });
    },
    [router, progress]
  );

  const heroReady = useCallback(() => setReady(true), []);

  const close = useCallback<FlightContextValue['close']>(
    (titleId, scrollOffset = 0) => {
      const o = origins.current.pop() ?? null;
      const offset = Math.max(0, scrollOffset);
      const canFly = !!o && o.title.id === titleId && offset < heroHeightFor(width) * 0.8;
      setClosingId(titleId);
      if (canFly) {
        setLanded(true);
        setFlight({ ...o, reverse: true, offsetY: -offset });
      }
      // Screen stays mounted (and fades itself out) until the flight has landed
      setTimeout(
        () => {
          if (router.canGoBack()) router.back();
          setClosingId(null);
        },
        canFly ? DURATION : 220
      );
    },
    [router, width]
  );

  // Flying artwork lands after DURATION. It stays until the detail hero has mounted, and a
  // timeout keeps it from ever getting stuck on screen.
  useEffect(() => {
    if (!flight || flight.reverse) return;
    const land = setTimeout(() => setLanded(true), DURATION);
    const cap = setTimeout(() => setReady(true), 1800);
    return () => {
      clearTimeout(land);
      clearTimeout(cap);
    };
  }, [flight]);

  const value = useMemo(
    () => ({
      open,
      close,
      flying: !!flight && !flight.reverse,
      progress,
      heroReady,
      closingId,
    }),
    [open, close, flight, progress, heroReady, closingId]
  );

  return (
    <FlightContext.Provider value={value}>
      {children}
      {flight ? (
        <Overlay
          flight={flight}
          progress={progress}
          handOver={landed && ready}
          onDone={() => setFlight(null)}
        />
      ) : null}
    </FlightContext.Provider>
  );
}

function Overlay({
  flight,
  progress,
  handOver,
  onDone,
}: {
  flight: Flight;
  progress: SharedValue<number>;
  /** Forward flight only: the artwork has landed and the detail hero is there to take over */
  handOver: boolean;
  onDone: () => void;
}) {
  const { width } = useWindowDimensions();
  const target = { x: 0, y: flight.offsetY ?? 0, width, height: heroHeightFor(width), radius: 0 };
  const reverse = !!flight.reverse;
  const local = useSharedValue(reverse ? 1 : 0);
  const p = reverse ? local : progress;
  const fade = useSharedValue(0);
  // w500 is what the card already showed, so it is in memory and paints on the first frame.
  // The sharp w1280 version loads over it.
  const small = imageUrl(flight.title.posterPath, 'w500');
  const large = imageUrl(flight.title.posterPath, 'w1280');
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!reverse) return;
    local.value = withTiming(0, { duration: DURATION, easing: fly });
    const t = setTimeout(() => done.current(), DURATION + 30);
    return () => clearTimeout(t);
  }, [local, reverse]);

  useEffect(() => {
    if (reverse || !handOver) return;
    fade.value = withTiming(1, { duration: 180, easing: Easing.linear });
    const t = setTimeout(() => done.current(), 200);
    return () => clearTimeout(t);
  }, [fade, handOver, reverse]);

  const box = useAnimatedStyle(() => ({
    left: interpolate(p.value, [0, 1], [flight.rect.x, target.x]),
    top: interpolate(p.value, [0, 1], [flight.rect.y, target.y]),
    width: interpolate(p.value, [0, 1], [flight.rect.width, target.width]),
    height: interpolate(p.value, [0, 1], [flight.rect.height, target.height]),
    borderRadius: interpolate(p.value, [0, 1], [flight.radius, target.radius]),
    opacity: reverse ? interpolate(p.value, [0, 0.26, 1], [0, 1, 1], 'clamp') : 1 - fade.value,
  }));
  const gradient = useAnimatedStyle(() => ({ opacity: p.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', overflow: 'hidden', backgroundColor: colors.s1 }, box]}>
      {small ? (
        <Image source={{ uri: small }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.s2 }]} />
      )}
      {large ? (
        <Image source={{ uri: large }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gradient]}>
        <Fade />
      </Animated.View>
    </Animated.View>
  );
}
