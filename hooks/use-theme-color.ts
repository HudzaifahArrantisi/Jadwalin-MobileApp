/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { DarkColors, LightColors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

const Colors = { light: LightColors, dark: DarkColors };

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof LightColors & keyof typeof DarkColors
) {
  const theme = useColorScheme() ?? 'dark';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
