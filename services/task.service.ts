// ============================================
// Jadwalin App — Task CRUD Service (BEIGE EDITION)
// Bug 4: Now syncs icon, deadlineTime, scheduledStart/End
// ============================================

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, onSnapshot, serverTimestamp,
  Timestamp, where,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Task, CreateTaskInput, UpdateTaskInput, TaskStatus,
} from '@/types/task.types';
import { getUserFriendlyError, isNetworkError } from '@/utils/networkError';

// ──── Helpers ────

/** Get the tasks collection reference for a user */
function tasksRef(userId: string) {
  return collection(db, 'users', userId, 'tasks');
}

/** Convert Firestore doc to Task object */
function docToTask(docSnap: any): Task {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title || '',
    description: data.description || '',
    date: data.date,
    status: data.status || 'pending',
    priority: data.priority || 'medium',
    category: data.category || 'task',
    showOnWidget: data.showOnWidget ?? false,
    reminder: data.reminder ?? false,
    reminderDays: data.reminderDays || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    completedAt: data.completedAt || null,
    // New fields for beige edition
    icon: data.icon || undefined,
    deadlineTime: data.deadlineTime || undefined,
    scheduledStart: data.scheduledStart || undefined,
    scheduledEnd: data.scheduledEnd || undefined,
  };
}

// ──── CRUD Operations ────

/** Create a new task */
export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  const now = serverTimestamp();
  const taskData: any = {
    title: input.title.trim(),
    description: input.description.trim(),
    date: Timestamp.fromDate(input.date),
    status: 'pending' as TaskStatus,
    priority: input.priority || 'medium',
    category: input.category || 'task',
    showOnWidget: input.showOnWidget,
    reminder: input.reminder,
    reminderDays: input.reminderDays,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };

  // Add optional new fields
  if (input.icon) taskData.icon = input.icon;
  if (input.deadlineTime) taskData.deadlineTime = input.deadlineTime;
  if (input.scheduledStart) taskData.scheduledStart = input.scheduledStart;
  if (input.scheduledEnd) taskData.scheduledEnd = input.scheduledEnd;

  const docRef = await addDoc(tasksRef(userId), taskData);

  return {
    ...taskData,
    id: docRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Task;
}

/** Update an existing task */
export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  const updateData: any = {
    updatedAt: serverTimestamp(),
  };

  if (input.title !== undefined) updateData.title = input.title.trim();
  if (input.description !== undefined)
    updateData.description = input.description.trim();
  if (input.date !== undefined) updateData.date = Timestamp.fromDate(input.date);
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.showOnWidget !== undefined)
    updateData.showOnWidget = input.showOnWidget;
  if (input.reminder !== undefined) updateData.reminder = input.reminder;
  if (input.reminderDays !== undefined)
    updateData.reminderDays = input.reminderDays;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.deadlineTime !== undefined) updateData.deadlineTime = input.deadlineTime;
  if (input.scheduledStart !== undefined) updateData.scheduledStart = input.scheduledStart;
  if (input.scheduledEnd !== undefined) updateData.scheduledEnd = input.scheduledEnd;
  if (input.status !== undefined) {
    updateData.status = input.status;
    if (input.status === 'completed') {
      updateData.completedAt = serverTimestamp();
    } else {
      updateData.completedAt = null;
    }
  }

  await updateDoc(taskRef, updateData);
}

/** Toggle task completion status */
export async function toggleTaskStatus(
  userId: string,
  taskId: string,
  currentStatus: TaskStatus
): Promise<TaskStatus> {
  const newStatus: TaskStatus =
    currentStatus === 'completed' ? 'pending' : 'completed';

  await updateTask(userId, taskId, { status: newStatus });
  return newStatus;
}

/** Delete a task */
export async function deleteTask(
  userId: string,
  taskId: string
): Promise<void> {
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
}

/** Fetch all tasks (one-time) */
export async function fetchTasks(userId: string): Promise<Task[]> {
  const q = query(tasksRef(userId), orderBy('date', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}

/** Subscribe to realtime task updates */
export function subscribeToTasks(
  userId: string,
  callback: (tasks: Task[]) => void,
  onError?: (error: Error, isOffline: boolean) => void
): () => void {
  const q = query(tasksRef(userId), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(docToTask);
    callback(tasks);
  }, (error) => {
    onError?.(new Error(getUserFriendlyError(error)), isNetworkError(error));
  });
}

/** Fetch tasks for a specific date */
export async function fetchTasksByDate(
  userId: string,
  date: Date
): Promise<Task[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const q = query(
    tasksRef(userId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay)),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToTask);
}
