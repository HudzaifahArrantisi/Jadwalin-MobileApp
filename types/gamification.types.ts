// ============================================
// Jadwalin App — Gamification Types
// ============================================

import { Timestamp } from 'firebase/firestore';

// ───── Point Constants ─────

/** Base points for completing a task */
export const POINTS_TASK_COMPLETE = 10;

/** Bonus points for completing a task on time */
export const POINTS_ON_TIME_BONUS = 5;

/** Bonus points for completing 3+ tasks in one day */
export const POINTS_DAILY_BONUS = 15;

/** Minimum tasks to earn daily bonus */
export const DAILY_BONUS_THRESHOLD = 3;

// ───── Level Definitions ─────

export interface LevelDefinition {
  name: string;
  minPoints: number;
  maxPoints: number;
  emoji: string;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { name: 'Pemula Produktif', minPoints: 0, maxPoints: 499, emoji: '🌱' },
  { name: 'Rajin', minPoints: 500, maxPoints: 1499, emoji: '⚡' },
  { name: 'Konsisten', minPoints: 1500, maxPoints: 2999, emoji: '🔥' },
  { name: 'Master Jadwal', minPoints: 3000, maxPoints: Infinity, emoji: '👑' },
];

/** Get the current level based on total points */
export function getUserLevel(totalPoints: number): LevelDefinition {
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_DEFINITIONS[i].minPoints) {
      return LEVEL_DEFINITIONS[i];
    }
  }
  return LEVEL_DEFINITIONS[0];
}

/** Get progress (0-1) within the current level */
export function getLevelProgress(totalPoints: number): number {
  const level = getUserLevel(totalPoints);
  if (level.maxPoints === Infinity) return 1;
  const range = level.maxPoints - level.minPoints + 1;
  const progress = totalPoints - level.minPoints;
  return Math.min(progress / range, 1);
}

// ───── Data Types ─────

/** User gamification stats stored in users/{uid} */
export interface UserGamificationStats {
  totalPoints: number;
  monthlyPoints: Record<string, number>; // key: yyyy-MM, value: points
  currentStreak: number;
  lastCompletedDate: string | null; // yyyy-MM-dd
  displayName: string;
  photoURL: string | null;
  updatedAt: Timestamp | null;
}

/** Point award record stored in users/{uid}/taskPoints/{taskId} */
export interface TaskPointAward {
  taskId: string;
  points: number;
  basePoints: number;
  bonusPoints: number;
  reason: string;
  completedAt: Timestamp;
  monthKey: string; // yyyy-MM
}

/** Leaderboard entry stored in leaderboards/monthly_{yyyy_MM}/users/{uid} */
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  completedTasks: number;
  currentStreak: number;
  updatedAt: Timestamp;
}

/** Default empty stats for safe fallback */
export const EMPTY_GAMIFICATION_STATS: UserGamificationStats = {
  totalPoints: 0,
  monthlyPoints: {},
  currentStreak: 0,
  lastCompletedDate: null,
  displayName: '',
  photoURL: null,
  updatedAt: null,
};
