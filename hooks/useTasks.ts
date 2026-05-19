// ============================================
// Jadwalin App — useTasks Hook
// ============================================

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import {
  subscribeToTasks,
  createTask as createTaskService,
  updateTask as updateTaskService,
  deleteTask as deleteTaskService,
  toggleTaskStatus as toggleStatusService,
} from '@/services/task.service';
import {
  scheduleTaskReminders,
  cancelTaskReminders,
  rescheduleTaskReminders,
} from '@/services/notification.service';
import { syncWidgetData } from '@/services/widget.service';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
} from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';

export function useTasks() {
  const {
    tasks,
    isLoading,
    error,
    user,
    notificationsEnabled,
    setTasks,
    setLoading,
    setError,
    setOffline,
  } = useTaskStore();

  // Subscribe to realtime updates + auto-sync widget
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const unsubscribe = subscribeToTasks(
      user.uid,
      (updatedTasks) => {
        setTasks(updatedTasks);
        setLoading(false);
        setOffline(false);
        setError(null);
        // Auto-sync widget data whenever tasks change
        syncWidgetData(updatedTasks).catch((err) => {
          console.warn('[useTasks] Widget sync failed:', err);
        });
      },
      (subscriptionError, isOffline) => {
        setLoading(false);
        setOffline(isOffline);
        setError(subscriptionError.message);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // ──── Filtered Task Lists ────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const todayTasks = tasks.filter((t) => {
    const d = parseTaskDate(t.date);
    return d && d >= today && d <= todayEnd && t.status !== 'archived';
  });

  const upcomingTasks = tasks.filter((t) => {
    const d = parseTaskDate(t.date);
    return d && d > todayEnd && t.status === 'pending';
  });

  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const overdueTasks = tasks.filter((t) => {
    const d = parseTaskDate(t.date);
    return d && d < today && t.status === 'pending';
  });

  const pendingTasks = tasks.filter((t) => t.status === 'pending');

  // ──── Actions ────

  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        const task = await createTaskService(user.uid, input);
        // Schedule reminders
        if (notificationsEnabled && input.reminder) {
          await scheduleTaskReminders(task);
        }
        return task;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid, notificationsEnabled]
  );

  const editTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        await updateTaskService(user.uid, taskId, input);
        // Reschedule if date or reminder changed
        if (input.date || input.reminder !== undefined || input.reminderDays) {
          const updatedTask = tasks.find((t) => t.id === taskId);
          if (updatedTask && notificationsEnabled) {
            await rescheduleTaskReminders({
              ...updatedTask,
              ...input,
              date: input.date
                ? ({ toDate: () => input.date } as any)
                : updatedTask.date,
            });
          }
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid, tasks, notificationsEnabled]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        await cancelTaskReminders(taskId);
        await deleteTaskService(user.uid, taskId);
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid]
  );

  const toggleStatus = useCallback(
    async (taskId: string, currentStatus: TaskStatus) => {
      if (!user?.uid) throw new Error('User not authenticated');
      setError(null);
      try {
        const newStatus = await toggleStatusService(
          user.uid,
          taskId,
          currentStatus
        );
        // Cancel reminders when completed
        if (newStatus === 'completed') {
          await cancelTaskReminders(taskId);
        } else if (notificationsEnabled) {
          // Re-enable reminders when uncompleted
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            await scheduleTaskReminders(task);
          }
        }
        return newStatus;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [user?.uid, tasks, notificationsEnabled]
  );

  // ──── Stats ────

  const stats = {
    total: tasks.filter((t) => t.status !== 'archived').length,
    pending: pendingTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
    todayCount: todayTasks.length,
  };

  return {
    tasks,
    todayTasks,
    upcomingTasks,
    completedTasks,
    overdueTasks,
    pendingTasks,
    stats,
    isLoading,
    error,
    addTask,
    editTask,
    removeTask,
    toggleStatus,
  };
}
