// ============================================
// Jadwalin App — Gamification Service
// ============================================
//
// All writes are idempotent:
// - taskPoints/{taskId} checked before awarding
// - Firestore runTransaction used for atomic updates
// - Network/offline errors are caught and logged, never crash the app
//

import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task } from '@/types/task.types';
import {
  UserGamificationStats,
  TaskPointAward,
  LeaderboardEntry,
  EMPTY_GAMIFICATION_STATS,
  POINTS_TASK_COMPLETE,
  POINTS_ON_TIME_BONUS,
  POINTS_DAILY_BONUS,
  DAILY_BONUS_THRESHOLD,
} from '@/types/gamification.types';
import { parseTaskDate } from '@/utils/date';

// ───── Helpers ─────

/** yyyy-MM format */
function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** yyyy-MM-dd format */
function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Check if task was completed on time */
function isOnTime(task: Task): boolean {
  const taskDate = parseTaskDate(task.date);
  if (!taskDate) return false;

  const now = new Date();

  // If task has a deadline time (e.g. "17.00"), compare with that
  if (task.deadlineTime) {
    const [hours, minutes] = task.deadlineTime.split('.').map(Number);
    const deadline = new Date(taskDate);
    deadline.setHours(hours || 0, minutes || 0, 59, 999);
    return now <= deadline;
  }

  // If task has a scheduled end, compare with that
  if (task.scheduledEnd) {
    const [hours, minutes] = task.scheduledEnd.split('.').map(Number);
    const deadline = new Date(taskDate);
    deadline.setHours(hours || 23, minutes || 59, 59, 999);
    return now <= deadline;
  }

  // Default: completed on same day or before is "on time"
  const endOfDay = new Date(taskDate);
  endOfDay.setHours(23, 59, 59, 999);
  return now <= endOfDay;
}

/** Check if two date strings are consecutive days */
function isConsecutiveDay(lastDateStr: string, todayStr: string): boolean {
  const last = new Date(lastDateStr + 'T00:00:00');
  const today = new Date(todayStr + 'T00:00:00');
  const diffMs = today.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// ───── Firestore References ─────

function userStatsRef(uid: string) {
  return doc(db, 'users', uid);
}

function taskPointRef(uid: string, taskId: string) {
  return doc(db, 'users', uid, 'taskPoints', taskId);
}

function leaderboardUserRef(monthKey: string, uid: string) {
  const safeMonth = monthKey.replace('-', '_');
  return doc(db, 'leaderboards', `monthly_${safeMonth}`, 'users', uid);
}

function leaderboardUsersCol(monthKey: string) {
  const safeMonth = monthKey.replace('-', '_');
  return collection(db, 'leaderboards', `monthly_${safeMonth}`, 'users');
}

// ───── Read Operations ─────

/** Fetch user gamification stats (safe, returns defaults on error) */
export async function fetchUserStats(uid: string): Promise<UserGamificationStats> {
  try {
    const snap = await getDoc(userStatsRef(uid));
    if (!snap.exists()) return { ...EMPTY_GAMIFICATION_STATS };
    const data = snap.data();
    return {
      totalPoints: data.totalPoints ?? 0,
      monthlyPoints: data.monthlyPoints ?? {},
      currentStreak: data.currentStreak ?? 0,
      lastCompletedDate: data.lastCompletedDate ?? null,
      displayName: data.displayName ?? '',
      photoURL: data.photoURL ?? null,
      updatedAt: data.updatedAt ?? null,
    };
  } catch (err) {
    console.warn('[Gamification] fetchUserStats failed:', err);
    return { ...EMPTY_GAMIFICATION_STATS };
  }
}

/** Fetch leaderboard for a given month (safe, returns [] on error) */
export async function fetchLeaderboard(monthKey: string): Promise<LeaderboardEntry[]> {
  try {
    const q = query(
      leaderboardUsersCol(monthKey),
      orderBy('points', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        uid: data.uid ?? d.id,
        displayName: data.displayName ?? 'User',
        photoURL: data.photoURL ?? null,
        points: data.points ?? 0,
        completedTasks: data.completedTasks ?? 0,
        currentStreak: data.currentStreak ?? 0,
        updatedAt: data.updatedAt ?? Timestamp.now(),
      };
    });
  } catch (err) {
    console.warn('[Gamification] fetchLeaderboard failed:', err);
    return [];
  }
}

// ───── Award Points ─────

/**
 * Award points for completing a task.
 * - Idempotent: checks if taskPoints/{taskId} already exists
 * - Uses transaction for atomic user stats update
 * - Never throws — logs errors and returns silently
 */
export async function awardTaskPoints(
  uid: string,
  task: Task,
  displayName: string,
  photoURL: string | null
): Promise<TaskPointAward | null> {
  try {
    const now = new Date();
    const monthKey = getMonthKey(now);
    const todayKey = getDateKey(now);
    const pointDocRef = taskPointRef(uid, task.id);

    // ── Calculate points ──
    const basePoints = POINTS_TASK_COMPLETE;
    let bonusPoints = 0;
    const reasons: string[] = ['Tugas selesai'];

    if (isOnTime(task)) {
      bonusPoints += POINTS_ON_TIME_BONUS;
      reasons.push('tepat waktu');
    }

    const totalPointsForTask = basePoints + bonusPoints;

    const award: TaskPointAward = {
      taskId: task.id,
      points: totalPointsForTask,
      basePoints,
      bonusPoints,
      reason: reasons.join(', '),
      completedAt: Timestamp.now(),
      monthKey,
    };

    const wasAwarded = await runTransaction(db, async (tx) => {
      const existingAward = await tx.get(pointDocRef);
      if (existingAward.exists()) {
        return false;
      }

      const statsRef = userStatsRef(uid);
      const statsSnap = await tx.get(statsRef);
      const current = statsSnap.exists() ? statsSnap.data() : {};

      const prevStreak = current.currentStreak ?? 0;
      const prevLastDate = current.lastCompletedDate ?? null;
      const prevMonthly = current.monthlyPoints ?? {};

      let newStreak = prevStreak;
      if (prevLastDate === todayKey) {
        newStreak = prevStreak;
      } else if (prevLastDate && isConsecutiveDay(prevLastDate, todayKey)) {
        newStreak = prevStreak + 1;
      } else {
        newStreak = 1;
      }

      const newMonthlyPoints = { ...prevMonthly };
      newMonthlyPoints[monthKey] = (newMonthlyPoints[monthKey] ?? 0) + totalPointsForTask;

      tx.set(pointDocRef, award);
      tx.set(
        statsRef,
        {
          totalPoints: (current.totalPoints ?? 0) + totalPointsForTask,
          monthlyPoints: newMonthlyPoints,
          currentStreak: newStreak,
          lastCompletedDate: todayKey,
          displayName: displayName || current.displayName || '',
          photoURL: photoURL ?? current.photoURL ?? null,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      return true;
    });

    if (!wasAwarded) {
      return null;
    }

    // ── Check daily bonus (outside transaction for simplicity) ──
    try {
      await checkAndAwardDailyBonus(uid, todayKey, monthKey);
    } catch (bonusErr) {
      console.warn('[Gamification] Daily bonus check failed:', bonusErr);
    }

    // ── Update leaderboard ──
    try {
      await updateLeaderboard(uid, monthKey, displayName, photoURL);
    } catch (lbErr) {
      console.warn('[Gamification] Leaderboard update failed:', lbErr);
    }

    return award;
  } catch (err) {
    console.warn('[Gamification] awardTaskPoints failed:', err);
    return null;
  }
}

// ───── Daily Bonus ─────

async function checkAndAwardDailyBonus(
  uid: string,
  todayKey: string,
  monthKey: string
): Promise<void> {
  const dailyBonusId = `daily_bonus_${todayKey}`;
  const bonusRef = taskPointRef(uid, dailyBonusId);

  // Count today's task completions
  const taskPointsCol = collection(db, 'users', uid, 'taskPoints');
  const allAwards = await getDocs(taskPointsCol);
  let todayCount = 0;
  allAwards.forEach((d) => {
    const data = d.data();
    if (data.completedAt) {
      const completedDate = data.completedAt.toDate
        ? data.completedAt.toDate()
        : new Date(data.completedAt);
      if (getDateKey(completedDate) === todayKey && !d.id.startsWith('daily_bonus_')) {
        todayCount++;
      }
    }
  });

  if (todayCount >= DAILY_BONUS_THRESHOLD) {
    const bonusAward: TaskPointAward = {
      taskId: dailyBonusId,
      points: POINTS_DAILY_BONUS,
      basePoints: 0,
      bonusPoints: POINTS_DAILY_BONUS,
      reason: `Bonus harian: ${todayCount} tugas selesai hari ini`,
      completedAt: Timestamp.now(),
      monthKey,
    };

    const awardedBonus = await runTransaction(db, async (tx) => {
      const existingBonus = await tx.get(bonusRef);
      if (existingBonus.exists()) {
        return false;
      }

      const statsRef = userStatsRef(uid);
      const statsSnap = await tx.get(statsRef);
      const current = statsSnap.exists() ? statsSnap.data() : {};
      const prevMonthly = current.monthlyPoints ?? {};
      const newMonthlyPoints = { ...prevMonthly };
      newMonthlyPoints[monthKey] = (newMonthlyPoints[monthKey] ?? 0) + POINTS_DAILY_BONUS;

      tx.set(bonusRef, bonusAward);
      tx.set(
        statsRef,
        {
          totalPoints: (current.totalPoints ?? 0) + POINTS_DAILY_BONUS,
          monthlyPoints: newMonthlyPoints,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );

      return true;
    });

    if (awardedBonus) {
      try {
        const stats = await fetchUserStats(uid);
        await setDoc(
          leaderboardUserRef(monthKey, uid),
          {
            points: stats.monthlyPoints[monthKey] ?? 0,
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      } catch (lbErr) {
        console.warn('[Gamification] Daily bonus leaderboard update failed:', lbErr);
      }
    }
  }
}

// ───── Leaderboard Update ─────

async function updateLeaderboard(
  uid: string,
  monthKey: string,
  displayName: string,
  photoURL: string | null
): Promise<void> {
  const stats = await fetchUserStats(uid);

  // Count completed tasks for this month from taskPoints
  const taskPointsCol = collection(db, 'users', uid, 'taskPoints');
  const allAwards = await getDocs(taskPointsCol);
  let completedTasks = 0;
  allAwards.forEach((d) => {
    const data = d.data();
    if (data.monthKey === monthKey && !d.id.startsWith('daily_bonus_')) {
      completedTasks++;
    }
  });

  const entry: LeaderboardEntry = {
    uid,
    displayName: displayName || stats.displayName || 'User',
    photoURL: photoURL ?? stats.photoURL ?? null,
    points: stats.monthlyPoints[monthKey] ?? 0,
    completedTasks,
    currentStreak: stats.currentStreak,
    updatedAt: Timestamp.now(),
  };

  await setDoc(leaderboardUserRef(monthKey, uid), entry, { merge: true });
}
