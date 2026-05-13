// ============================================
// Jadwalin App — Widget Bridge Service
// Syncs task data → Native Widget (Android/iOS)
// ============================================
//
// HOW IT WORKS:
// 1. React Native stores tasks in Zustand (persisted via AsyncStorage).
// 2. This service filters today's widget-eligible tasks and writes
//    a simplified JSON payload to AsyncStorage under a special key.
// 3. A custom Expo Config Plugin copies that data to Android
//    SharedPreferences (or iOS App Groups) on app launch / task change.
// 4. The native Kotlin/Swift widget reads SharedPreferences/AppGroups
//    and renders the data on the homescreen.
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { Task } from '@/types/task.types';

// ───── Constants ─────

/** Key used by both RN and native widget to share data */
export const WIDGET_STORAGE_KEY = 'jadwalin_widget_data';

/** Maximum number of tasks shown on the widget */
const MAX_WIDGET_TASKS = 5;

// ───── Types ─────

/** Simplified task structure that the native widget understands */
export interface WidgetTask {
  id: string;
  title: string;
  time: string;        // e.g. "13:00" or "Sepanjang hari"
  icon: string;        // Ionicon name
  category: string;    // 'schedule' | 'task' | 'reminder'
  status: string;      // 'pending' | 'completed'
  priority: string;    // 'low' | 'medium' | 'high'
}

/** Full widget payload written to SharedPreferences */
export interface WidgetData {
  tasks: WidgetTask[];
  dateLabel: string;   // e.g. "Selasa, 13 Mei 2026"
  totalTasks: number;
  completedTasks: number;
  updatedAt: string;   // ISO timestamp
}

// ───── Helpers ─────

/** Format a Date to Indonesian locale label */
function formatDateLabel(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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
 * containing only today's widget-eligible tasks.
 */
export function buildWidgetData(tasks: Task[]): WidgetData {
  const today = new Date();
  
  // Filter: today's tasks that are widget-visible
  const todayTasks = tasks.filter((t) => {
    const taskDate = toDate(t.date);
    if (!taskDate) return false;
    return isToday(taskDate) && t.showOnWidget;
  });

  // Sort: pending first, then by scheduled time
  const sorted = todayTasks.sort((a, b) => {
    // Pending tasks come first
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    // Then sort by time
    const timeA = a.scheduledStart || a.deadlineTime || '23:59';
    const timeB = b.scheduledStart || b.deadlineTime || '23:59';
    return timeA.localeCompare(timeB);
  });

  // Map to simple widget format
  const widgetTasks: WidgetTask[] = sorted.slice(0, MAX_WIDGET_TASKS).map((t) => ({
    id: t.id,
    title: t.title,
    time: t.scheduledStart
      ? `${t.scheduledStart}${t.scheduledEnd ? ' - ' + t.scheduledEnd : ''}`
      : t.deadlineTime || 'Sepanjang hari',
    icon: t.icon || 'calendar-outline',
    category: t.category,
    status: t.status,
    priority: t.priority,
  }));

  return {
    tasks: widgetTasks,
    dateLabel: formatDateLabel(today),
    totalTasks: todayTasks.length,
    completedTasks: todayTasks.filter((t) => t.status === 'completed').length,
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

    // 2. Write to native SharedPreferences (Android)
    if (Platform.OS === 'android') {
      try {
        // This native module will be created in Kotlin
        const { JadwalinWidgetModule } = NativeModules;
        if (JadwalinWidgetModule?.updateWidgetData) {
          JadwalinWidgetModule.updateWidgetData(json);
        }
      } catch (e) {
        // Native module not yet available (e.g. running in Expo Go)
        console.log('[Widget] Native module not available, skipping native sync.');
      }
    }

    console.log(`[Widget] Synced ${widgetData.tasks.length} tasks for widget`);
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
