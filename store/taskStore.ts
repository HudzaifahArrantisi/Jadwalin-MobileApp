// ============================================
// Jadwalin App — Zustand Global Store (PRO)
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, TaskStore, ThemeMode, UserProfile, NoteList } from '@/types/task.types';

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      // ───── Tasks State ─────
      tasks: [],
      isLoading: false,
      error: null,

      // ───── Notes (Daftar Saya) State ─────
      notes: [],
      notesLoading: false,

      // ───── Auth State ─────
      user: null,
      isAuthenticated: false,
      isAuthLoading: true,

      // ───── Settings State ─────
      themeMode: 'dark' as ThemeMode,
      notificationsEnabled: true,
      isOffline: false,
      hasSeenOnboarding: false,

      // ───── Task Actions ─────
      setTasks: (tasks: Task[]) => set({ tasks }),

      addTask: (task: Task) =>
        set((state) => ({ tasks: [task, ...state.tasks] })),

      updateTask: (id: string, updates: Partial<Task>) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      removeTask: (id: string) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      // ───── Note Actions ─────
      setNotes: (notes: NoteList[]) => set({ notes }),

      addNote: (note: NoteList) =>
        set((state) => ({ notes: [note, ...state.notes] })),

      updateNote: (id: string, updates: Partial<NoteList>) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      removeNote: (id: string) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      setNotesLoading: (notesLoading: boolean) => set({ notesLoading }),

      // ───── Auth Actions ─────
      setUser: (user: UserProfile | null) =>
        set({
          user,
          isAuthenticated: !!user,
          isAuthLoading: false,
        }),

      setAuthLoading: (isAuthLoading: boolean) => set({ isAuthLoading }),

      // ───── Settings Actions ─────
      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),

      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'light' ? 'dark' : 'light',
        })),

      setNotificationsEnabled: (notificationsEnabled: boolean) =>
        set({ notificationsEnabled }),

      setOffline: (isOffline: boolean) =>
        set({ isOffline }),

      setHasSeenOnboarding: (hasSeenOnboarding: boolean) =>
        set({ hasSeenOnboarding }),
    }),
    {
      name: 'jadwalin-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist settings + cached tasks/notes for offline
      partialize: (state) => ({
        themeMode: state.themeMode,
        notificationsEnabled: state.notificationsEnabled,
        tasks: state.tasks,
        notes: state.notes,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);
