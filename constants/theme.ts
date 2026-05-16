// ============================================
// Jadwalin App — DARK PREMIUM EDITION Theme
// Matching Dark Mode UI/UX reference images
// ============================================

import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Responsive Scaling Utilities ───
// Base design width is 390 (iPhone 14 size)
const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

/** Scale width proportionally */
export const sw = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/** Scale height proportionally */
export const sh = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

/** Moderate scale — recommended for font sizes & paddings */
export const ms = (size: number, factor = 0.5) =>
  size + (sw(size) - size) * factor;

/** Normalize font size across devices */
export const normalize = (size: number) => {
  const newSize = ms(size);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// ─── Color Palette (Purple/White/Black/Grey Theme) ───

export const Colors = {
  // Primary backgrounds
  cream: '#FFFFFF',            // Main page background
  beige: '#F3F4F6',            // Header background / Light grey
  beigeDark: '#E5E7EB',        // Elevated Surface
  brown: '#6B7280',            // Muted Gray (Secondary text)
  brownDark: '#7C3AED',        // Vivid Purple (Primary accent)
  brownLight: '#F9FAFB',       // Card Surface

  // Activity card section
  dailyCardBg: '#FFFFFF',
  dailyCardBorder: '#E5E7EB',

  // Colorful task card palette
  taskPurple: '#A855F7',
  taskBlue: '#38BDF8',
  taskGreen: '#22C55E',
  taskRed: '#EF4444',
  taskPink: '#EC4899',
  taskOrange: '#F97316',
  taskTeal: '#14B8A6',
  taskYellow: '#EAB308',

  // Pastel colors for lists/notes
  pastelGreen: '#D1FAE5',
  pastelGreenDark: '#A7F3D0',
  pastelRose: '#FCE7F3',
  pastelBlue: '#DBEAFE',

  // Status colors
  checkGreen: '#10B981',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#1F2937',      // Near Black
  textSecondary: '#6B7280',    // Muted Gray
  textMuted: '#9CA3AF',        // Dim Gray
  textLight: '#FFFFFF',

  // Inputs & borders
  inputBg: '#F3F4F6',
  inputBorder: '#E5E7EB',
  borderLight: '#E5E7EB',

  // Tab bar
  tabBarBg: '#FFFFFF',
  tabBarActive: '#7C3AED',
  tabBarInactive: '#9CA3AF',

  // Calendar
  calendarHeader: '#FFFFFF',
  calendarSelected: '#7C3AED',
  calendarToday: '#F3F4F6',
  calendarDot: '#7C3AED',
  calendarPastDay: '#7C3AED',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Profile section
  profileBg: '#F3F4F6',
  profileFormBg: '#FFFFFF',
} as const;

// ─── Task Card Color Palette ───
// Rotating colors assigned to tasks for visual variety
export const TASK_CARD_COLORS = [
  '#A855F7',  // Purple
  '#38BDF8',  // Blue
  '#22C55E',  // Green
  '#EF4444',  // Red
  '#EC4899',  // Pink
  '#F97316',  // Orange
  '#14B8A6',  // Teal
  '#EAB308',  // Yellow
] as const;

/** Get a task card color based on index or string hash */
export function getTaskCardColor(indexOrTitle: number | string): string {
  if (typeof indexOrTitle === 'number') {
    return TASK_CARD_COLORS[indexOrTitle % TASK_CARD_COLORS.length];
  }
  // Simple string hash for consistent color per task title
  let hash = 0;
  for (let i = 0; i < indexOrTitle.length; i++) {
    hash = indexOrTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TASK_CARD_COLORS[Math.abs(hash) % TASK_CARD_COLORS.length];
}

// ─── Spacing System (responsive) ───

export const Spacing = {
  xxs: sw(2),
  xs: sw(4),
  sm: sw(8),
  md: sw(16),
  lg: sw(24),
  xl: sw(32),
  xxl: sw(48),
} as const;

// ─── Border Radius ───

export const Radius = {
  xs: sw(4),
  sm: sw(8),
  md: sw(12),
  lg: sw(16),
  xl: sw(20),
  xxl: sw(28),
  full: 999,
} as const;

// ─── Font Sizes (responsive) ───

export const FontSize = {
  xxs: normalize(10),
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  body: normalize(16),
  lg: normalize(18),
  xl: normalize(20),
  xxl: normalize(24),
  hero: normalize(28),
  title: normalize(32),
} as const;

// ─── Font Weights ───

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ─── Shadows (subtle for dark mode) ───

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
