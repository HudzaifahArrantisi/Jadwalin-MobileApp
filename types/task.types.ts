// ============================================
// Jadwalin App — TypeScript Type Definitions
// (BEIGE EDITION — Updated for new UI)
// ============================================

import { Timestamp } from 'firebase/firestore';

/** Task status options */
export type TaskStatus = 'pending' | 'completed' | 'archived';

/** Task priority levels */
export type TaskPriority = 'low' | 'medium' | 'high';

/** Task category — determines where the item appears */
export type TaskCategory = 'schedule' | 'task' | 'reminder';

/** Reminder day presets — days before deadline */
export type ReminderDay = 0 | 1 | 2 | 3 | 5 | 7;

/** Available reminder day options */
export const REMINDER_DAY_OPTIONS: ReminderDay[] = [7, 5, 3, 2, 1, 0];

/** Label mapping for reminder days */
export const REMINDER_DAY_LABELS: Record<ReminderDay, string> = {
  7: 'H-7',
  5: 'H-5',
  3: 'H-3',
  2: 'H-2',
  1: 'H-1',
  0: 'Hari H',
};

/** Category label mapping */
export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  schedule: 'Jadwal',
  task: 'Tugas',
  reminder: 'Pengingat',
};

/** Category icon mapping */
export const TASK_CATEGORY_ICONS: Record<TaskCategory, string> = {
  schedule: 'calendar',
  task: 'checkbox',
  reminder: 'alarm',
};

/** Category color mapping */
export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  schedule: '#7C3AED',
  task: '#3B82F6',
  reminder: '#F59E0B',
};

/** Available icons for task (shown in calendar) */
export const TASK_ICON_OPTIONS = [
  { key: 'videocam', label: 'Meet/Rapat' },
  { key: 'calendar-outline', label: 'Jadwal' },
  { key: 'document-text-outline', label: 'Tugas' },
  { key: 'school-outline', label: 'Kuliah' },
  { key: 'briefcase-outline', label: 'Kerja' },
  { key: 'people-outline', label: 'Grup' },
  { key: 'cafe-outline', label: 'Kopi' },
  { key: 'restaurant-outline', label: 'Makan' },
  { key: 'fitness-outline', label: 'Olahraga' },
  { key: 'musical-notes-outline', label: 'Musik' },
  { key: 'airplane-outline', label: 'Travel' },
  { key: 'cart-outline', label: 'Belanja' },
] as const;

// ───── Task ─────

/** Task data as stored in Firestore */
export interface Task {
  id: string;
  title: string;
  description: string;
  date: Timestamp;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  showOnWidget: boolean;
  reminder: boolean;
  reminderDays: ReminderDay[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  // New fields for beige edition
  icon?: string;           // Ionicon name
  deadlineTime?: string;   // e.g. "13.00"
  scheduledStart?: string;  // e.g. "13.00"
  scheduledEnd?: string;    // e.g. "14.30"
}

/** Data required to create a new task */
export interface CreateTaskInput {
  title: string;
  description: string;
  date: Date;
  priority?: TaskPriority;
  category?: TaskCategory;
  showOnWidget: boolean;
  reminder: boolean;
  reminderDays: ReminderDay[];
  // New optional fields
  icon?: string;
  deadlineTime?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

/** Data for updating an existing task */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  date?: Date;
  priority?: TaskPriority;
  category?: TaskCategory;
  showOnWidget?: boolean;
  reminder?: boolean;
  reminderDays?: ReminderDay[];
  status?: TaskStatus;
  icon?: string;
  deadlineTime?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

// ───── Note (Daftar Saya) ─────

/** A note item inside a note list */
export interface NoteItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

/** A note list (Daftar Saya) */
export interface NoteList {
  id: string;
  title: string;
  emoji: string;
  color: string;
  type?: 'list' | 'text';
  content?: string;
  items: NoteItem[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Data required to create a new note list */
export interface CreateNoteListInput {
  title: string;
  emoji: string;
  color: string;
  type?: 'list' | 'text';
  content?: string;
  items: Omit<NoteItem, 'id'>[];
}

/** Data for updating a note list */
export interface UpdateNoteListInput {
  title?: string;
  emoji?: string;
  color?: string;
  type?: 'list' | 'text';
  content?: string;
  items?: NoteItem[];
}

// ───── User ─────

/** User profile from Firebase Auth */
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
  // New fields for profile editing
  job?: string;
  address?: string;
}

// ───── Calendar ─────

/** Marked date entry for react-native-calendars */
export interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
  dots?: Array<{ key: string; color: string }>;
}

/** Map of date strings to marked date configs */
export type MarkedDates = Record<string, MarkedDate>;

// ───── Theme ─────

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  primaryGlow: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighest: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  borderSubtle: string;
  inputBackground: string;
  tabBar: string;
  tabBarInactive: string;
  statusBar: 'light' | 'dark';
  overlay: string;
  shimmer: string;
}

// ───── Store ─────

export interface TaskStore {
  // Tasks
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  // Notes (Daftar Saya)
  notes: NoteList[];
  notesLoading: boolean;

  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // Settings
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  isOffline: boolean;
  hasSeenOnboarding: boolean;

  // Task actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Note actions
  setNotes: (notes: NoteList[]) => void;
  addNote: (note: NoteList) => void;
  updateNote: (id: string, updates: Partial<NoteList>) => void;
  removeNote: (id: string) => void;
  setNotesLoading: (loading: boolean) => void;

  // Auth actions
  setUser: (user: UserProfile | null) => void;
  setAuthLoading: (loading: boolean) => void;

  // Settings actions
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setOffline: (offline: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
}

// ───── Navigation ─────

export interface TaskRouteParams {
  taskId?: string;
  date?: string; // ISO date string — prefill when adding from calendar
  category?: TaskCategory;
}
