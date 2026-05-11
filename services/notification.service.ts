// ============================================
// Jadwalin App — Notification Service
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
      name: 'Task Reminders',
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

  for (const daysBefore of task.reminderDays) {
    const triggerDate = new Date(deadline);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(8, 0, 0, 0); // Remind at 8:00 AM

    // Don't schedule if already in the past
    if (triggerDate <= new Date()) continue;

    const reminderLabel =
      daysBefore === 0 ? 'Hari ini' : `${daysBefore} hari lagi`;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ ${task.title}`,
          body: `Deadline ${reminderLabel}! Jangan lupa kerjakan tugasmu.`,
          data: { taskId: task.id },
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
    } catch (error) {
      console.warn(`Failed to schedule reminder H-${daysBefore}:`, error);
    }
  }

  return notificationIds;
}

/** Cancel all notifications for a specific task */
export async function cancelTaskReminders(taskId: string): Promise<void> {
  const allScheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of allScheduled) {
    if (notification.identifier.startsWith(`${taskId}-reminder-`)) {
      await Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      );
    }
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
