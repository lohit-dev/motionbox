import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { clearApiCache } from '@/lib/api';
import { setTmdbLanguage } from '@/lib/tmdb';
import type { AiringSegment, LibraryTab, TitleId } from '@/types';

/** Content languages offered in Profile. The code goes to TMDB. */
export const LANGUAGES = [
  { label: 'English', code: 'en-US' },
  { label: 'Hindi', code: 'hi-IN' },
  { label: 'Telugu', code: 'te-IN' },
] as const;

export interface AppState {
  saved: TitleId[];
  shortsSaved: TitleId[];
  shortsWatched: TitleId[];
  watching: TitleId[];
  watched: TitleId[];
  reminders: TitleId[];
  recentSearches: string[];

  /** Index into LANGUAGES */
  language: number;
  updatesRead: boolean;
  onboarded: boolean;

  libraryTab: LibraryTab;
  /** 0 = Sunday */
  airingDay: number;
  airingSegment: AiringSegment;

  toggleSave: (id: TitleId) => void;
  toggleShortSave: (id: TitleId) => void;
  markShortWatched: (id: TitleId) => void;
  toggleReminder: (id: TitleId) => void;
  toggleWatching: (id: TitleId) => void;
  markWatched: (id: TitleId) => void;
  unmarkWatched: (id: TitleId) => void;
  clearHistory: () => void;
  addRecent: (text: string) => void;
  clearRecents: () => void;
  setLanguage: (index: number) => void;
  markUpdatesRead: () => void;
  finishOnboarding: () => void;
  setLibraryTab: (tab: LibraryTab) => void;
  setAiringDay: (day: number) => void;
  setAiringSegment: (segment: AiringSegment) => void;
}

const toggle = (list: TitleId[], id: TitleId) =>
  list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];

const isTmdbId = (id: string) => /^(movie|tv)-\d+$/.test(id);

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      saved: [],
      shortsSaved: [],
      shortsWatched: [],
      watching: [],
      watched: [],
      reminders: [],
      recentSearches: [],

      language: 0,
      updatesRead: false,
      onboarded: false,

      libraryTab: 'saved',
      airingDay: new Date().getDay(),
      airingSegment: 'all',

      toggleSave: (id) => set((s) => ({ saved: toggle(s.saved, id), updatesRead: false })),
      toggleShortSave: (id) => set((s) => ({ shortsSaved: toggle(s.shortsSaved, id) })),
      markShortWatched: (id) =>
        set((s) =>
          s.shortsWatched.includes(id) ? s : { shortsWatched: [id, ...s.shortsWatched] }
        ),
      toggleReminder: (id) => set((s) => ({ reminders: toggle(s.reminders, id) })),
      toggleWatching: (id) =>
        set((s) => ({
          watching: toggle(s.watching, id),
          watched: s.watched.filter((x) => x !== id),
        })),
      markWatched: (id) =>
        set((s) => ({
          watching: s.watching.filter((x) => x !== id),
          watched: s.watched.includes(id) ? s.watched : [id, ...s.watched],
        })),
      unmarkWatched: (id) => set((s) => ({ watched: s.watched.filter((x) => x !== id) })),
      clearHistory: () => set({ watching: [], watched: [] }),
      addRecent: (text) =>
        set((s) => {
          const value = text.trim();
          if (!value) return s;
          return {
            recentSearches: [value, ...s.recentSearches.filter((x) => x !== value)].slice(0, 6),
          };
        }),
      clearRecents: () => set({ recentSearches: [] }),
      setLanguage: (language) => {
        setTmdbLanguage(LANGUAGES[language]?.code ?? 'en-US');
        clearApiCache();
        set({ language });
      },
      markUpdatesRead: () => set({ updatesRead: true }),
      finishOnboarding: () => set({ onboarded: true }),
      setLibraryTab: (libraryTab) => set({ libraryTab }),
      setAiringDay: (airingDay) => set({ airingDay }),
      setAiringSegment: (airingSegment) => set({ airingSegment }),
    }),
    {
      name: 'motionbox-v1',
      version: 5,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted) => {
        const s = persisted as Record<string, unknown>;
        const ids = (value: unknown) =>
          (Array.isArray(value) ? value : Object.keys((value as object) ?? {})).filter(
            (id): id is string => typeof id === 'string' && isTmdbId(id)
          );
        return {
          saved: ids(s.saved),
          shortsSaved: ids(s.shortsSaved),
          shortsWatched: ids(s.shortsWatched),
          watching: ids(s.watching),
          watched: ids(s.watched),
          reminders: ids(s.reminders),
          recentSearches: [],
          language: typeof s.language === 'number' ? s.language : 0,
          updatesRead: !!s.updatesRead,
          onboarded: !!s.onboarded,
          libraryTab: (s.libraryTab as LibraryTab) ?? 'saved',
        } as unknown as AppState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) setTmdbLanguage(LANGUAGES[state.language]?.code ?? 'en-US');
      },
      // Keep what the person did; transient UI state starts fresh each launch
      partialize: (s) => ({
        saved: s.saved,
        shortsSaved: s.shortsSaved,
        shortsWatched: s.shortsWatched,
        watching: s.watching,
        watched: s.watched,
        reminders: s.reminders,
        recentSearches: s.recentSearches,
        language: s.language,
        updatesRead: s.updatesRead,
        onboarded: s.onboarded,
        libraryTab: s.libraryTab,
      }),
    }
  )
);

/** True once saved state has been read from disk. */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useApp.persist.onFinishHydration(onChange),
    () => useApp.persist.hasHydrated(),
    () => useApp.persist.hasHydrated()
  );
}

export const useIsSaved = (id: TitleId) => useApp((s) => s.saved.includes(id));
export const useIsShortSaved = (id: TitleId) => useApp((s) => s.shortsSaved.includes(id));
export const useIsShortWatched = (id: TitleId) => useApp((s) => s.shortsWatched.includes(id));
export const useHasReminder = (id: TitleId) => useApp((s) => s.reminders.includes(id));
