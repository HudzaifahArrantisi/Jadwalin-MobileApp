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
  cream: '#FFFDF9',          // Cloud Cream (Main page background)
  beige: '#F8F3ED',          // Soft Sand (Header background)
  beigeDark: '#E8D9C5',      // Almond (Tab bar pill)
  brown: '#9C8B75',          // Driftwood (Brown text/accents)
  brownDark: '#6B5D4F',      // Espresso Muted (Important text/buttons)
  brownLight: '#D4C4AD',     // Sand Dollar (Light brown cards)

  // Activity card section (daily tasks - stone area)
  dailyCardBg: '#C4B8A4',    // Warm Stone background
  dailyCardBorder: '#B5A894',

  // Pastel colors for lists/notes
  pastelGreen: '#E2EDDA',    // Sage Mist
  pastelGreenDark: '#C8D9BC', // Sage
  pastelRose: '#FDF0ED',     // Dusty Rose (BARU)
  pastelBlue: '#E4ECF3',     // Mist Blue (BARU)

  // Status colors (Desaturated/Pastel)
  checkGreen: '#7FB685',     // Soft Fern
  success: '#7FB685',
  warning: '#D4A96A',
  danger: '#D4816B',         // Terracotta (Soft danger)
  info: '#9AB3D4',

  // Basic colors
  white: '#FFFFFF',
  black: '#2D2B28',          // Charcoal Warm
  textPrimary: '#2D2B28',
  textSecondary: '#7A7570',  // Pebble
  textMuted: '#A8A29E',      // Stone
  textLight: '#FFFFFF',

  // Inputs & borders
  inputBg: '#FFFFFF',
  inputBorder: '#EFE9E1',    // Linen
  borderLight: '#EDE8E1',

  // Tab bar
  tabBarBg: '#FFFDF9',
  tabBarActive: '#6B5D4F',
  tabBarInactive: '#A8A29E',

  // Calendar
  calendarHeader: '#F8F3ED',
  calendarSelected: '#6B5D4F',
  calendarToday: '#D4C4AD',
  calendarDot: '#7FB685',

  // Overlay
  overlay: 'rgba(45, 43, 40, 0.4)',

  // Profile section
  profileBg: '#F5EDE3',
  profileFormBg: '#E8D9C5',
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
    shadowColor: '#6B5D4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#6B5D4F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#2D2B28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
