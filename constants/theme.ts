// ============================================
// Jadwalin App — BEIGE/CREAM EDITION Theme
// Matching UI/UX reference images
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

// ─── Color Palette (Beige/Cream Edition from UI reference) ───

export const Colors = {
  // Primary backgrounds
  cream: '#FFF8F0',          // Main page background
  beige: '#F5E6D3',          // Header/profile top section
  beigeDark: '#D4B896',      // Darker beige accent
  brown: '#8B7355',          // Brown text/accents
  brownDark: '#5C4A32',      // Dark brown for important text
  brownLight: '#C4A882',     // Light brown cards

  // Activity card section (daily tasks - brown area)
  dailyCardBg: '#C9B99A',    // The brownish card background
  dailyCardBorder: '#B8A88A',

  // Pastel green for weekly list items
  pastelGreen: '#D4E8C2',    // Light pastel green for list items
  pastelGreenDark: '#B8D4A0', // Slightly darker green

  // Accent colors
  checkGreen: '#4CAF50',     // Green checkmark color
  white: '#FFFFFF',
  black: '#1A1A1A',
  textPrimary: '#2C2C2C',
  textSecondary: '#6B6B6B',
  textMuted: '#999999',
  textLight: '#FFFFFF',

  // Inputs & borders
  inputBg: '#FFFFFF',
  inputBorder: '#E0D5C7',
  borderLight: '#E8DDD0',

  // Tab bar
  tabBarBg: '#FFF8F0',
  tabBarActive: '#5C4A32',
  tabBarInactive: '#B0A090',

  // Calendar
  calendarHeader: '#F0E4D4',
  calendarSelected: '#8B7355',
  calendarToday: '#D4B896',
  calendarDot: '#7B9B6B',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  danger: '#F44336',
  info: '#2196F3',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Profile section gradient
  profileBg: '#ECD9C6',
  profileFormBg: '#D4B896',
} as const;

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

// ─── Shadows ───

export const Shadow = {
  sm: {
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#5C4A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
