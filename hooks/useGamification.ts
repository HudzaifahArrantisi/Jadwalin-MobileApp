// ============================================
// Jadwalin App — useGamification Hook
// ============================================
//
// Provides gamification stats and leaderboard data.
// Safe by design: never makes the screen blank on error.
//

import { useEffect, useState, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import {
  fetchUserStats,
  fetchLeaderboard,
  subscribeToLeaderboard,
} from '@/services/gamification.service';
import {
  UserGamificationStats,
  LeaderboardEntry,
  EMPTY_GAMIFICATION_STATS,
  getUserLevel,
  getLevelProgress,
} from '@/types/gamification.types';

function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function useGamification() {
  const user = useTaskStore((s) => s.user);
  const [stats, setStats] = useState<UserGamificationStats>(EMPTY_GAMIFICATION_STATS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthKey = getCurrentMonthKey();
  const monthlyPoints = stats.monthlyPoints[monthKey] ?? 0;
  const level = getUserLevel(stats.totalPoints);
  const levelProgress = getLevelProgress(stats.totalPoints);

  // Find user rank in leaderboard
  const userRank = user?.uid
    ? leaderboard.findIndex((e) => e.uid === user.uid) + 1
    : 0;

  // Load stats
  const loadStats = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const data = await fetchUserStats(user.uid);
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.warn('[useGamification] loadStats failed:', err);
      setError('Gagal memuat statistik');
      // Keep existing stats — don't blank them
    }
  }, [user?.uid]);

  // Load leaderboard
  const loadLeaderboard = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(monthKey);
      setLeaderboard(data);
      setError(null);
    } catch (err: any) {
      console.warn('[useGamification] loadLeaderboard failed:', err);
      setError('Gagal memuat leaderboard');
      // Keep existing leaderboard data
    }
  }, [monthKey]);

  // Realtime leaderboard subscription
  useEffect(() => {
    const unsubscribe = subscribeToLeaderboard(
      monthKey,
      (data) => {
        setLeaderboard(data);
        setError(null);
      },
      () => {
        setError('Gagal memuat leaderboard');
      }
    );
    return unsubscribe;
  }, [monthKey]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadStats(), loadLeaderboard()]);
    setIsLoading(false);
  }, [loadStats, loadLeaderboard]);

  // Auto-load on mount and when user changes
  useEffect(() => {
    if (user?.uid) {
      refresh();
    }
  }, [user?.uid]);

  return {
    stats,
    leaderboard,
    monthlyPoints,
    monthKey,
    level,
    levelProgress,
    userRank,
    isLoading,
    error,
    refresh,
  };
}
