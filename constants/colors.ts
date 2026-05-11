// ============================================
// Jadwalin App — BLACK PREMIUM Design System
// ============================================

import { ThemeColors, ThemeMode } from '@/types/task.types';

// ─── BLACK EDITION PALETTE ───

export const DarkColors: ThemeColors = {
  primary: '#7C3AED',
  primaryGlow: 'rgba(124, 58, 237, 0.25)',
  secondary: '#A78BFA',
  background: '#000000',
  surface: '#111111',
  surfaceElevated: '#161616',
  surfaceHighest: '#1C1C1C',
  card: '#0D0D0D',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#6B7280',
  textDim: '#404040',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#1F1F1F',
  borderSubtle: '#141414',
  inputBackground: '#111111',
  tabBar: '#0A0A0A',
  tabBarInactive: '#404040',
  statusBar: 'light',
  overlay: 'rgba(0, 0, 0, 0.7)',
  shimmer: '#1A1A1A',
};

export const LightColors: ThemeColors = {
  primary: '#7C3AED',
  primaryGlow: 'rgba(124, 58, 237, 0.12)',
  secondary: '#A78BFA',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHighest: '#F5F5F5',
  card: '#FFFFFF',
  text: '#0F0F0F',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  textDim: '#9CA3AF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  inputBackground: '#F3F4F6',
  tabBar: '#FFFFFF',
  tabBarInactive: '#9CA3AF',
  statusBar: 'dark',
  overlay: 'rgba(0, 0, 0, 0.3)',
  shimmer: '#E5E7EB',
};

/** Get the color palette for a given theme mode */
export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DarkColors : LightColors;
}

// ─── SPACING ───

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ─── BORDER RADIUS ───

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
} as const;

// ─── TYPOGRAPHY (Inter) ───

export const FontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  body: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  hero: 30,
  title: 34,
  giant: 42,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// ─── SHADOWS ───

export const Shadow = {
  none: {},
  subtle: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowSm: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ─── ANIMATION PRESETS ───

export const AnimConfig = {
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  springBouncy: {
    damping: 12,
    stiffness: 200,
    mass: 0.6,
  },
  springGentle: {
    damping: 25,
    stiffness: 120,
    mass: 1,
  },
  timing: {
    duration: 250,
  },
  timingSlow: {
    duration: 400,
  },
} as const;
