// ============================================
// Jadwalin App — useTheme Hook
// ============================================

import { useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { getColors } from '@/constants/colors';
import { ThemeColors, ThemeMode } from '@/types/task.types';

export function useTheme() {
  const { themeMode, toggleTheme, setThemeMode } = useTaskStore();

  // Respect user theme preference from store
  const colors: ThemeColors = useMemo(() => getColors(themeMode), [themeMode]);
  const isDark = themeMode === 'dark';

  return {
    colors,
    themeMode,
    isDark,
    toggleTheme,
    setThemeMode,
  };
}
