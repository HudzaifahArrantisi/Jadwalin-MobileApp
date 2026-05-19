// ============================================
// Jadwalin App — useAuth Hook
// ============================================

import { useEffect, useCallback } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { onAuthChanged, logout as logoutService } from '@/services/auth.service';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isAuthLoading,
    setUser,
    setAuthLoading,
    setOffline,
    setError,
  } = useTaskStore();

  // Listen to Firebase auth state
  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthChanged(
      (firebaseUser) => {
        setUser(firebaseUser);
      },
      (error, isOffline) => {
        setOffline(isOffline);
        setError(error.message);
      }
    );

    return unsubscribe;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutService();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isAuthLoading,
    logout,
  };
}
