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
  interpolate,
  makeMutable,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import colors from '@/constants/colors';
import { Fade } from '@/components/Fade';
import { ease, fly } from '@/lib/motion';
import { imageUrl } from '@/lib/tmdb';
import type { Title } from '@/types';

const DURATION = 540;
/** The flight never waits longer than this for the detail hero to paint */
const HANDOVER_CAP = 1600;

/** Height of the detail hero. The flight lands on exactly this box. */
export const heroHeightFor = (screenWidth: number) => Math.min(640, screenWidth * 1.64);

/** Where the artwork comes from: a poster card, or a hero that already is the textless art */
export type FlightSource = 'poster' | 'hero';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * One per open detail screen. `progress` is 0 at the card and 1 at the detail, and it is the
 * only thing that moves: the flying artwork, the page background, the entrance of the detail
 * content and the closing flight all read it, so opening and closing are one animation played
 * in both directions and every frame is computed on the UI thread.
 */
export interface FlightEntry {
  id: string;
  title: Title;
  /** Null when the detail was opened without a card to fly from */
  rect: Rect | null;
  source: FlightSource;
  progress: SharedValue<number>;
  /** 1 once the detail hero has painted, so the flying artwork can hand over to it */
  landed: SharedValue<number>;
  closing: boolean;
}

interface FlightApi {
  /** Opens a title. Pass the card's view so the artwork can fly from it. */
  open: (title: Title, from?: ViewInstance | null, source?: FlightSource) => void;
  /**
   * Goes back from a title. Flies the hero into the card it came from when it can.
   * Pass the detail scroll offset.
   */
  close: (id: string, scrollOffset?: number) => void;
  /** The detail screen calls this once, on mount, to get its own flight */
  claim: (id: string) => FlightEntry;
  /** The detail screen calls this on unmount */
  release: (entry: FlightEntry) => void;
  /** 0 to 1: how much a detail screen covers the tabs. Slides the tab bar away. */
  cover: SharedValue<number>;
}

const FlightContext = createContext<FlightApi | null>(null);

const useFlight = () => {
  const api = useContext(FlightContext);
  if (!api) throw new Error('FlightProvider is missing');
  return api;
};

// The context value never changes, so using these hooks never re-renders a screen
export const useOpenTitle = () => useFlight().open;
export const useCloseTitle = () => useFlight().close;
export const useClaimFlight = () => useFlight().claim;
export const useReleaseFlight = () => useFlight().release;
export const useTabCover = () => useFlight().cover;

interface Active {
  entry: FlightEntry;
  closing: boolean;
  /** Where the hero sits when closing: minus the detail scroll offset */
  offsetY: number;
}

export function FlightProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [active, setActive] = useState<Active | null>(null);
  const cover = useSharedValue(0);
  /** One entry per open detail screen, so each close flies back to its own card */
  const entries = useRef<FlightEntry[]>([]);
  const flying = useRef(false);
  const latest = useRef({ router, width });
  useEffect(() => {
    latest.current = { router, width };
  });

  const api = useMemo<FlightApi>(() => {
    const idle = () => {
      if (!entries.current.length) {
        cover.set(withTiming(0, { duration: 280, easing: ease }));
      }
    };

    const push = (id: string, title: Title, rect: Rect | null, source: FlightSource) => {
      const entry: FlightEntry = {
        id,
        title,
        rect,
        source,
        progress: makeMutable(rect ? 0 : 1),
        landed: makeMutable(rect ? 0 : 1),
        closing: false,
      };
      entries.current.push(entry);
      return entry;
    };

    const go = (id: string) =>
      latest.current.router.push({ pathname: '/title/[id]', params: { id } });

    return {
      cover,

      open: (title, from, source = 'poster') => {
        // A second tap while artwork is still flying would stack two details
        if (flying.current) return;
        const start = (rect: Rect | null) => {
          const entry = push(title.id, title, rect, source);
          cover.set(withTiming(1, { duration: 260, easing: ease }));
          if (rect) {
            flying.current = true;
            setActive({ entry, closing: false, offsetY: 0 });
            entry.progress.set(withTiming(1, { duration: DURATION, easing: fly }));
            // UI-thread timer: if the hero never reports in, hand over anyway
            entry.landed.set(withDelay(HANDOVER_CAP, withTiming(1, { duration: 1 })));
          }
          go(title.id);
        };
        if (!from) return start(null);
        from.measureInWindow((x, y, w, h) => start(w && h ? { x, y, width: w, height: h } : null));
      },

      close: (id, scrollOffset = 0) => {
        const entry = [...entries.current].reverse().find((e) => e.id === id);
        if (!entry || entry.closing) return;
        entry.closing = true;
        const offset = Math.max(0, scrollOffset);
        const canFly = !!entry.rect && offset < heroHeightFor(latest.current.width) * 0.8;
        const finish = () => {
          entries.current = entries.current.filter((e) => e !== entry);
          flying.current = false;
          setActive(null);
          if (latest.current.router.canGoBack()) latest.current.router.back();
        };
        // Tabs come back while the artwork is still flying home
        if (entries.current.length === 1) {
          cover.set(withDelay(canFly ? 220 : 0, withTiming(0, { duration: 300, easing: ease })));
        }
        if (canFly) {
          flying.current = true;
          setActive({ entry, closing: true, offsetY: -offset });
        }
        entry.progress.set(
          withTiming(
            0,
            canFly ? { duration: DURATION, easing: fly } : { duration: 240, easing: ease },
            (done) => {
              if (done) runOnJS(finish)();
            }
          )
        );
      },

      claim: (id) => {
        // Opened by open(): its entry is waiting. Opened any other way (a link, a restored
        // route): make a settled entry so close() still has something to find.
        const own = [...entries.current].reverse().find((e) => e.id === id && !e.closing);
        if (own) return own;
        const fallback = push(id, { id } as Title, null, 'poster');
        cover.set(1);
        return fallback;
      },

      release: (entry) => {
        entries.current = entries.current.filter((e) => e !== entry);
        idle();
      },
    };
  }, [cover]);

  const onLanded = useCallback(() => {
    flying.current = false;
    setActive(null);
  }, []);

  return (
    <FlightContext.Provider value={api}>
      {children}
      {active ? (
        <Overlay
          key={`${active.entry.id}-${active.closing ? 'close' : 'open'}`}
          entry={active.entry}
          closing={active.closing}
          offsetY={active.offsetY}
          onLanded={onLanded}
        />
      ) : null}
    </FlightContext.Provider>
  );
}

function Overlay({
  entry,
  closing,
  offsetY,
  onLanded,
}: {
  entry: FlightEntry;
  closing: boolean;
  offsetY: number;
  onLanded: () => void;
}) {
  const { width } = useWindowDimensions();
  const { rect, progress, landed, title, source } = entry;
  const from = rect ?? { x: 0, y: 0, width, height: heroHeightFor(width) };
  const targetHeight = heroHeightFor(width);
  const radius = source === 'hero' ? 0 : 14;
  const fade = useSharedValue(0);

  // w500 is what the card already showed, so it is in memory and paints on the first frame
  const card = source === 'poster' ? imageUrl(title.posterPath, 'w500') : null;
  // What the detail hero shows. Same file as the card when no textless art is known yet.
  const hero = imageUrl(title.heroPath || title.posterPath, 'w1280');
  // Card poster has lettering baked in, the hero does not: swap them while moving, not after
  const swaps = !!card && !!title.heroPath && title.heroPath !== title.posterPath;

  // Opening: once the artwork has landed and the detail hero has painted, fade out and unmount
  useAnimatedReaction(
    () => !closing && progress.value >= 1 && landed.value === 1,
    (ready, was) => {
      if (ready && !was) {
        fade.value = withTiming(1, { duration: 160 }, (done) => {
          if (done) runOnJS(onLanded)();
        });
      }
    }
  );

  const box = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      left: interpolate(p, [0, 1], [from.x, 0]),
      top: interpolate(p, [0, 1], [from.y, offsetY]),
      width: interpolate(p, [0, 1], [from.width, width]),
      height: interpolate(p, [0, 1], [from.height, targetHeight]),
      borderRadius: interpolate(p, [0, 1], [radius, 0]),
      // Closing: appears over the detail hero in the first few frames, then lands on the card
      opacity: closing ? interpolate(p, [0.94, 1], [1, 0], 'clamp') : 1 - fade.value,
    };
  });
  const heroLayer = useAnimatedStyle(() => ({
    opacity: swaps ? interpolate(progress.value, [0.2, 0.75], [0, 1], 'clamp') : 1,
  }));
  const gradient = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.3, 1], [0, 1], 'clamp'),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', overflow: 'hidden', backgroundColor: colors.s1 }, box]}>
      {card ? (
        <Image source={{ uri: card }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.s2 }]} />
      )}
      {hero ? (
        <Animated.Image
          source={{ uri: hero }}
          style={[StyleSheet.absoluteFill, heroLayer]}
          resizeMode="cover"
        />
      ) : null}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gradient]}>
        <Fade />
      </Animated.View>
    </Animated.View>
  );
}
