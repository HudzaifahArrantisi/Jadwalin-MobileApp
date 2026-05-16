// ============================================
// Jadwalin App — Notification Service
// Auto-reminder at H-7, H-3, H-2, H-1
// ============================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Task, ReminderDay } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';

// ──── Configuration ────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ──── Constants ────

/** Default reminder days when creating a task with reminder enabled */
export const DEFAULT_REMINDER_DAYS: ReminderDay[] = [7, 3, 2, 1];

/** Indonesian month names for notification body */
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Format date to readable Indonesian string */
function formatDateIndo(date: Date): string {
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${dayNames[date.getDay()]}, ${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/** Build a dynamic notification body based on days remaining */
function buildReminderBody(task: Task, daysBefore: number, taskDate: Date): string {
  const dateStr = formatDateIndo(taskDate);
  const timeStr = task.scheduledStart
    ? ` pukul ${task.scheduledStart}`
    : task.deadlineTime
      ? ` pukul ${task.deadlineTime}`
      : '';

  if (daysBefore === 0) {
    return `Hari ini${timeStr}! Pastikan semuanya siap. 📅 ${dateStr}`;
  } else if (daysBefore === 1) {
    return `Besok${timeStr}! Jangan lupa persiapan. 📅 ${dateStr}`;
  } else {
    return `${daysBefore} hari lagi${timeStr}! Jangan lupa persiapan. 📅 ${dateStr}`;
  }
}

/** Build a notification title with emoji based on urgency */
function buildReminderTitle(taskTitle: string, daysBefore: number): string {
  if (daysBefore === 0) return `🔔 ${taskTitle}`;
  if (daysBefore <= 2) return `⏰ ${taskTitle}`;
  return `📋 ${taskTitle}`;
}

// ──── Permission ────

/** Request notification permissions */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices');
    return false;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Pengingat Jadwal',
      description: 'Notifikasi pengingat sebelum jadwal kegiatan',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7C3AED',
      sound: 'default',
    });
  }

  return true;
}

// ──── Scheduling ────

/** Schedule all reminder notifications for a task */
export async function scheduleTaskReminders(task: Task): Promise<string[]> {
  if (!task.reminder || task.reminderDays.length === 0) return [];

  const notificationIds: string[] = [];
  const deadline = parseTaskDate(task.date);
  if (!deadline) return [];

  // Set deadline to start of day for accurate day-diff calculation
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  for (const daysBefore of task.reminderDays) {
    const triggerDate = new Date(deadlineDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(8, 0, 0, 0); // Remind at 8:00 AM local time

    // Don't schedule if already in the past
    if (triggerDate <= new Date()) continue;

    const title = buildReminderTitle(task.title, daysBefore);
    const body = buildReminderBody(task, daysBefore, deadlineDate);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            taskId: task.id,
            daysBefore,
            taskDate: deadlineDate.toISOString(),
          },
          sound: 'default',
          ...(Platform.OS === 'android' && { channelId: 'reminders' }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
        identifier: `${task.id}-reminder-${daysBefore}`,
      });
      notificationIds.push(id);
      console.log(`[Notification] Scheduled H-${daysBefore} for "${task.title}" at ${triggerDate.toLocaleString()}`);
    } catch (error) {
      console.warn(`[Notification] Failed to schedule H-${daysBefore} for "${task.title}":`, error);
    }
  }

  return notificationIds;
}

/** Cancel all notifications for a specific task */
export async function cancelTaskReminders(taskId: string): Promise<void> {
  try {
    const allScheduled =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of allScheduled) {
      if (notification.identifier.startsWith(`${taskId}-reminder-`)) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
        console.log(`[Notification] Cancelled ${notification.identifier}`);
      }
    }
  } catch (error) {
    console.warn('[Notification] Error cancelling reminders:', error);
  }
}

/** Reschedule all reminders for a task (cancel old + schedule new) */
export async function rescheduleTaskReminders(
  task: Task
): Promise<string[]> {
  await cancelTaskReminders(task.id);
  return scheduleTaskReminders(task);
}

/** Cancel all scheduled notifications */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Get count of currently scheduled notifications (for debugging) */
export async function getScheduledCount(): Promise<number> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.length;
}

/** List all scheduled notifications (for debugging) */
export async function listScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ──── Notification Response Handler ────

/** Setup notification tap handler */
export function setupNotificationResponseListener(
  onTap: (taskId: string) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const taskId = response.notification.request.content.data?.taskId;
      if (taskId) {
        onTap(taskId as string);
      }
    }
  );
}
