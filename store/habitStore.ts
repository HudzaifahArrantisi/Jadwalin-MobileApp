// ============================================
// Jadwalin App — Zustand Habit Store
// Offline-first habit tracking with persist
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Habit {
  id: string;
  name: string;
  icon: string;
}

export interface HabitStore {
  habits: Habit[];
  /** Record<habitId, Record<dateStr, boolean>> */
  history: Record<string, Record<string, boolean>>;

  toggleHabit: (habitId: string, dateStr: string) => void;
  isHabitDone: (habitId: string, dateStr: string) => boolean;
  getCompletedCount: (dateStr: string) => number;
}

const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Minum Air', icon: '💧' },
  { id: 'h2', name: 'Membaca', icon: '📖' },
  { id: 'h3', name: 'Meditasi', icon: '🧘' },
];

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,
      history: {},

      toggleHabit: (habitId: string, dateStr: string) =>
        set((state) => {
          const habitHistory = { ...(state.history[habitId] || {}) };
          habitHistory[dateStr] = !habitHistory[dateStr];
          return {
            history: {
              ...state.history,
              [habitId]: habitHistory,
            },
          };
        }),

      isHabitDone: (habitId: string, dateStr: string) => {
        return !!get().history[habitId]?.[dateStr];
      },

      getCompletedCount: (dateStr: string) => {
        const { habits, history } = get();
        return habits.filter((h) => !!history[h.id]?.[dateStr]).length;
      },
    }),
    {
      name: 'jadwalin-habits',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        history: state.history,
      }),
    }
  )
);
