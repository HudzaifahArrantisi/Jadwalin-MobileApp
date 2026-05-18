// ============================================
// Jadwalin App — Widget Bridge Service
// Syncs WEEKLY task data → Native Widget (Android)
// ============================================
//
// HOW IT WORKS:
// 1. React Native stores tasks in Zustand (persisted via AsyncStorage).
// 2. This service filters THIS WEEK's tasks and writes
//    a simplified JSON payload to AsyncStorage under a special key.
// 3. The Config Plugin generates Kotlin native code that reads
//    SharedPreferences and renders a ListView widget on the homescreen.
// 4. NativeModules bridge pushes data from RN → SharedPreferences
//    and triggers widget refresh via AppWidgetManager.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { Task } from '@/types/task.types';

// ───── Constants ─────

/** Key used by both RN and native widget to share data */
export const WIDGET_STORAGE_KEY = 'jadwalin_widget_data';

/** Maximum number of tasks shown on the widget */
const MAX_WIDGET_TASKS = 8;

// ───── Types ─────

/** Simplified task structure that the native widget understands */
export interface WidgetTask {
  id: string;
  title: string;
  time: string;        // e.g. "13:00 - 14:30" or "Sepanjang hari"
  date: string;        // e.g. "Sen, 20 Mei"
  icon: string;        // Ionicon name
  category: string;    // 'schedule' | 'task' | 'reminder'
  status: string;      // 'pending' | 'completed'
  isToday: boolean;    // whether the task is today
}

/** Full widget payload written to SharedPreferences */
export interface WidgetData {
  tasks: WidgetTask[];
  weekLabel: string;   // e.g. "19 - 25 Mei 2026"
  dateLabel: string;   // e.g. "Selasa, 20 Mei 2026"
  totalTasks: number;
  completedTasks: number;
  updatedAt: string;   // ISO timestamp
}

// ───── Helpers ─────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_NAMES_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** Format a Date to Indonesian locale label */
function formatDateLabel(date: Date): string {
  return `${DAY_NAMES_FULL[date.getDay()]}, ${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}

/** Format a short date label for list items */
function formatShortDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** Get the Monday-Sunday week range for a given date */
function getWeekRange(date: Date): { monday: Date; sunday: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { monday, sunday };
}

/** Format week range label */
function formatWeekLabel(monday: Date, sunday: Date): string {
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} - ${sunday.getDate()} ${MONTHS_FULL[monday.getMonth()]} ${monday.getFullYear()}`;
  }
  return `${monday.getDate()} ${MONTHS_SHORT[monday.getMonth()]} - ${sunday.getDate()} ${MONTHS_SHORT[sunday.getMonth()]} ${monday.getFullYear()}`;
}

/** Safely extract a JS Date from various Firestore / string formats */
function toDate(value: any): Date | null {
  if (!value) return null;
  // Firestore Timestamp
  if (typeof value.toDate === 'function') return value.toDate();
  // Firestore-like { seconds }
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  // ISO string or epoch number
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/** Check if a date falls on today */
function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ───── Core Functions ─────

/**
 * Transforms the full task list into a lightweight widget payload
 * containing THIS WEEK's tasks (Monday to Sunday).
 */
export function buildWidgetData(tasks: Task[]): WidgetData {
  const today = new Date();
  const { monday, sunday } = getWeekRange(today);
  
  // Filter: this week's tasks
  const weekTasks = tasks.filter((t) => {
    const taskDate = toDate(t.date);
    if (!taskDate) return false;
    taskDate.setHours(0, 0, 0, 0);
    return taskDate >= monday && taskDate <= sunday;
  });

  // Sort: by date first, then by time
  const sorted = weekTasks.sort((a, b) => {
    const dateA = toDate(a.date);
    const dateB = toDate(b.date);
    if (!dateA || !dateB) return 0;
    
    // Sort by date first
    const dateDiff = dateA.getTime() - dateB.getTime();
    if (dateDiff !== 0) return dateDiff;
    
    // Then by time
    const timeA = a.scheduledStart || a.deadlineTime || '23:59';
    const timeB = b.scheduledStart || b.deadlineTime || '23:59';
    return timeA.localeCompare(timeB);
  });

  // Map to simple widget format
  const widgetTasks: WidgetTask[] = sorted.slice(0, MAX_WIDGET_TASKS).map((t) => {
    const taskDate = toDate(t.date);
    return {
      id: t.id,
      title: t.title,
      time: t.scheduledStart
        ? `${t.scheduledStart}${t.scheduledEnd ? ' - ' + t.scheduledEnd : ''}`
        : t.deadlineTime || 'Sepanjang hari',
      date: taskDate ? formatShortDate(taskDate) : '',
      icon: t.icon || 'calendar-outline',
      category: t.category,
      status: t.status,
      isToday: taskDate ? isToday(taskDate) : false,
    };
  });

  return {
    tasks: widgetTasks,
    weekLabel: formatWeekLabel(monday, sunday),
    dateLabel: formatDateLabel(today),
    totalTasks: weekTasks.length,
    completedTasks: weekTasks.filter((t) => t.status === 'completed').length,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Writes widget data to AsyncStorage AND triggers native
 * SharedPreferences update (Android) for the widget to read.
 */
export async function syncWidgetData(tasks: Task[]): Promise<void> {
  try {
    const widgetData = buildWidgetData(tasks);
    const json = JSON.stringify(widgetData);

    // 1. Write to AsyncStorage (React Native side)
    await AsyncStorage.setItem(WIDGET_STORAGE_KEY, json);

    // 2. Write to native SharedPreferences (Android) and refresh widget.
    //    The native module uses commit() (synchronous write) and then
    //    directly calls updateAppWidget + notifyAppWidgetViewDataChanged,
    //    so the widget sees the new data immediately.
    if (Platform.OS === 'android') {
      try {
        const { JadwalinWidgetModule } = NativeModules;
        if (JadwalinWidgetModule?.updateWidgetData) {
          await Promise.resolve(JadwalinWidgetModule.updateWidgetData(json));
          console.log(
            `[Widget] ✅ Synced ${widgetData.tasks.length} tasks for widget (week: ${widgetData.weekLabel})`
          );
        } else {
          console.log('[Widget] JadwalinWidgetModule.updateWidgetData not found');
        }
      } catch (e) {
        // Native module not yet available (e.g. running in Expo Go)
        console.log('[Widget] Native module not available, skipping native sync:', e);
      }
    }
  } catch (error) {
    console.warn('[Widget] Failed to sync widget data:', error);
  }
}

/**
 * Reads the last-synced widget data from AsyncStorage.
 * Useful for debugging or displaying widget preview in-app.
 */
export async function getWidgetData(): Promise<WidgetData | null> {
  try {
    const json = await AsyncStorage.getItem(WIDGET_STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as WidgetData;
  } catch {
    return null;
  }
}

/**
 * Clears widget data (e.g. on logout).
 */
export async function clearWidgetData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WIDGET_STORAGE_KEY);
    if (Platform.OS === 'android') {
      try {
        const { JadwalinWidgetModule } = NativeModules;
        if (JadwalinWidgetModule?.clearWidgetData) {
          JadwalinWidgetModule.clearWidgetData();
        }
      } catch (e) {
        // Native module not available
      }
    }
  } catch (error) {
    console.warn('[Widget] Failed to clear widget data:', error);
  }
}
