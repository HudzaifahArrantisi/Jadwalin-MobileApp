import { Dimensions, PixelRatio } from 'react-native';
import { useMemo } from 'react';
import { useTaskStore } from '@/store/taskStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const guidelineBaseWidth = 390;
const guidelineBaseHeight = 844;

export const sw = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
export const sh = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
export const ms = (size: number, factor = 0.5) => size + (sw(size) - size) * factor;
export const normalize = (size: number) => Math.round(PixelRatio.roundToNearestPixel(ms(size)));

export const LightColors = {
  cream: '#FAF8F5',
  beige: '#F2EDE5',
  beigeDark: '#E6DED2',
  brown: '#6B6A68',
  brownDark: '#4E3F6F',
  brownLight: '#FFFFFF',

  dailyCardBg: '#FFFFFF',
  dailyCardBorder: '#E5DED4',

  taskPurple: '#8B7BA8',
  taskBlue: '#7A9CAF',
  taskGreen: '#6B8E23',
  taskRed: '#B76E6E',
  taskPink: '#C8A0A8',
  taskOrange: '#B98758',
  taskTeal: '#739D93',
  taskYellow: '#B8A35F',

  pastelGreen: '#E4E8D8',
  pastelGreenDark: '#D5DEC4',
  pastelRose: '#F0DDDB',
  pastelBlue: '#DDE5EA',
  pastelOat: '#EFE6D8',
  pastelLavender: '#E3DDEB',

  checkGreen: '#6B8E23',
  success: '#6B8E23',
  warning: '#B98758',
  danger: '#A84949',
  info: '#7A9CAF',

  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6A68',
  textMuted: '#9A9690',
  textLight: '#FFFFFF',

  inputBg: 'rgba(255,255,255,0.38)',
  inputBorder: '#D8D0C5',
  borderLight: '#E7E0D7',

  tabBarBg: 'rgba(255,255,255,0.88)',
  tabBarActive: '#4E3F6F',
  tabBarInactive: '#9A9690',

  calendarHeader: '#FAF8F5',
  calendarSelected: '#4E3F6F',
  calendarToday: '#EDE6DC',
  calendarDot: '#6B8E23',
  calendarPastDay: '#CFC6BB',

  overlay: 'rgba(26, 26, 26, 0.36)',
  profileBg: '#FAF8F5',
  profileFormBg: '#FFFFFF',
} as const;

export const DarkColors = {
  cream: '#0D0D0E',
  beige: '#151516',
  beigeDark: '#202022',
  brown: '#A7A19A',
  brownDark: '#B8A9D6',
  brownLight: '#000000',

  dailyCardBg: '#000000',
  dailyCardBorder: 'rgba(255,255,255,0.06)',

  taskPurple: '#B8A9D6',
  taskBlue: '#8EAEBE',
  taskGreen: '#9CAF72',
  taskRed: '#C18484',
  taskPink: '#CFAAB1',
  taskOrange: '#C59B70',
  taskTeal: '#8BB2A8',
  taskYellow: '#C5B778',

  pastelGreen: '#202719',
  pastelGreenDark: '#29321F',
  pastelRose: '#2B1D20',
  pastelBlue: '#1A242A',
  pastelOat: '#242018',
  pastelLavender: '#211D2B',

  checkGreen: '#9CAF72',
  success: '#9CAF72',
  warning: '#C59B70',
  danger: '#D08A8A',
  info: '#8EAEBE',

  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#F4F1EC',
  textSecondary: '#B8B0A7',
  textMuted: '#7F7972',
  textLight: '#FFFFFF',

  inputBg: 'rgba(255,255,255,0.03)',
  inputBorder: 'rgba(255,255,255,0.09)',
  borderLight: 'rgba(255,255,255,0.06)',

  tabBarBg: 'rgba(0,0,0,0.88)',
  tabBarActive: '#B8A9D6',
  tabBarInactive: '#77716C',

  calendarHeader: '#0D0D0E',
  calendarSelected: '#B8A9D6',
  calendarToday: '#1C1C1E',
  calendarDot: '#9CAF72',
  calendarPastDay: '#2B2B2D',

  overlay: 'rgba(0, 0, 0, 0.72)',
  profileBg: '#0D0D0E',
  profileFormBg: '#000000',
} as const;

export type ColorsType = typeof LightColors;

export function useAppTheme() {
  const themeMode = useTaskStore((s) => s.themeMode);
  const activeColors = useMemo(() => (themeMode === 'dark' ? DarkColors : LightColors), [themeMode]);
  return { Colors: activeColors, isDark: themeMode === 'dark' };
}

export const Colors = LightColors;

export const TASK_CARD_COLORS = [
  LightColors.taskPurple,
  LightColors.taskBlue,
  LightColors.taskGreen,
  LightColors.taskRed,
  LightColors.taskPink,
  LightColors.taskOrange,
  LightColors.taskTeal,
  LightColors.taskYellow,
] as const;

export function getTaskCardColor(indexOrTitle: number | string): string {
  if (typeof indexOrTitle === 'number') return TASK_CARD_COLORS[indexOrTitle % TASK_CARD_COLORS.length];

  let hash = 0;
  for (let i = 0; i < indexOrTitle.length; i++) {
    hash = indexOrTitle.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TASK_CARD_COLORS[Math.abs(hash) % TASK_CARD_COLORS.length];
}

export const Spacing = {
  xxs: sw(2),
  xs: sw(4),
  sm: sw(8),
  md: sw(16),
  lg: sw(24),
  xl: sw(32),
  xxl: sw(48),
} as const;

export const Radius = {
  xs: sw(4),
  sm: sw(8),
  md: sw(12),
  lg: sw(16),
  xl: sw(20),
  xxl: sw(28),
  full: 999,
} as const;

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

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 0,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  glow: {
    shadowColor: '#4E3F6F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 1,
  },
} as const;

export { SCREEN_WIDTH, SCREEN_HEIGHT };
