// ============================================
// Jadwalin App — Custom Top Alert/Toast Notification
// ============================================

import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable, Platform, StatusBar } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/taskStore';
import { useAppTheme, Spacing, Radius, FontSize, Shadow } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ToastNotification() {
  const toast = useTaskStore((s) => s.toast);
  const hideToast = useTaskStore((s) => s.hideToast);
  const { Colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast) return null;

  const { message, type } = toast;

  let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
  let iconColor: string = Colors.success;
  
  if (type === 'warning') {
    iconName = 'alert-circle';
    iconColor = Colors.warning;
  } else if (type === 'info') {
    iconName = 'information-circle';
    iconColor = Colors.info;
  }

  // Determine top positioning dynamically to handle notches nicely
  const topPosition = Platform.OS === 'ios' 
    ? Math.max(insets.top, 20) + Spacing.xs 
    : (StatusBar.currentHeight || 0) + Spacing.sm;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15).stiffness(150)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        {
          top: topPosition,
          backgroundColor: isDark ? 'rgba(21, 21, 22, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          borderColor: Colors.borderLight,
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
      <Text style={[styles.text, { color: Colors.textPrimary }]} numberOfLines={2}>
        {message}
      </Text>
      <Pressable 
        onPress={hideToast} 
        style={styles.closeBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    ...Shadow.md,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  text: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeBtn: {
    marginLeft: Spacing.xs,
    padding: 2,
  },
});
