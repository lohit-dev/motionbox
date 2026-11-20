import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AiringSegment, LibraryTab, TitleId } from '@/types';

interface Settings {
  reminders: boolean;
  autoplay: boolean;
}

export interface AppState {
  saved: TitleId[];
  /** Title id -> percent watched (0-100) */
  watching: Record<TitleId, number>;
  watched: TitleId[];
  reminders: TitleId[];
  hiddenContinue: TitleId[];
  settings: Settings;

  language: number;
  updatesRead: boolean;
  onboarded: boolean;
  /** Demo switch for the offline state */
  offline: boolean;

  libraryTab: LibraryTab;
  /** 0 = Sunday */
  airingDay: number;
  airingSegment: AiringSegment;

  toggleSave: (id: TitleId) => void;
  toggleReminder: (id: TitleId) => void;
  setProgress: (id: TitleId, percent: number) => void;
  markWatched: (id: TitleId) => void;
  hideContinue: (id: TitleId) => void;
  clearHistory: () => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setLanguage: (index: number) => void;
  markUpdatesRead: () => void;
  finishOnboarding: () => void;
  setOffline: (offline: boolean) => void;
  setLibraryTab: (tab: LibraryTab) => void;
  setAiringDay: (day: number) => void;
  setAiringSegment: (segment: AiringSegment) => void;
}

const toggle = (list: TitleId[], id: TitleId) =>
  list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      saved: [],
      watching: {},
      watched: [],
      reminders: [],
      hiddenContinue: [],
      settings: { reminders: true, autoplay: true },

      language: 0,
      updatesRead: false,
      onboarded: false,
      offline: false,

      libraryTab: 'saved',
      airingDay: new Date().getDay(),
      airingSegment: 'all',

      toggleSave: (id) => set((s) => ({ saved: toggle(s.saved, id) })),
      toggleReminder: (id) => set((s) => ({ reminders: toggle(s.reminders, id) })),
      setProgress: (id, percent) =>
        set((s) => ({
          watching: { ...s.watching, [id]: percent },
          hiddenContinue: s.hiddenContinue.filter((x) => x !== id),
        })),
      markWatched: (id) =>
        set((s) => {
          const { [id]: _removed, ...watching } = s.watching;
          return { watching, watched: s.watched.includes(id) ? s.watched : [id, ...s.watched] };
        }),
      hideContinue: (id) => set((s) => ({ hiddenContinue: [id, ...s.hiddenContinue] })),
      clearHistory: () => set({ watching: {}, watched: [], hiddenContinue: [] }),
      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      setLanguage: (language) => set({ language }),
      markUpdatesRead: () => set({ updatesRead: true }),
      finishOnboarding: () => set({ onboarded: true }),
      setOffline: (offline) => set({ offline }),
      setLibraryTab: (libraryTab) => set({ libraryTab }),
      setAiringDay: (airingDay) => set({ airingDay }),
      setAiringSegment: (airingSegment) => set({ airingSegment }),
    }),
    {
      name: 'motionbox-v1',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppState>;
        const isTmdbId = (id: string) => /^(movie|tv)-\d+$/.test(id);
        return {
          ...state,
          saved: (state.saved ?? []).filter(isTmdbId),
          watching: Object.fromEntries(
            Object.entries(state.watching ?? {}).filter(([id]) => isTmdbId(id))
          ),
          watched: (state.watched ?? []).filter(isTmdbId),
          reminders: (state.reminders ?? []).filter(isTmdbId),
          hiddenContinue: (state.hiddenContinue ?? []).filter(isTmdbId),
        };
      },
      // Keep what the person did; transient UI state starts fresh each launch
      partialize: (s) => ({
        saved: s.saved,
        watching: s.watching,
        watched: s.watched,
        reminders: s.reminders,
        hiddenContinue: s.hiddenContinue,
        settings: s.settings,
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
  const [ready, setReady] = useState(useApp.persist.hasHydrated());
  useEffect(() => {
    if (useApp.persist.hasHydrated()) setReady(true);
    return useApp.persist.onFinishHydration(() => setReady(true));
  }, []);
  return ready;
}

export const useIsSaved = (id: TitleId) => useApp((s) => s.saved.includes(id));
export const useHasReminder = (id: TitleId) => useApp((s) => s.reminders.includes(id));
