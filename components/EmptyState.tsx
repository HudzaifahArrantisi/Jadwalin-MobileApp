// ============================================
// Jadwalin App — Animated EmptyState
// ============================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { BorderRadius, FontSize, Spacing, AnimConfig, Shadow } from '@/constants/colors';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  ctaText?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({
  icon = 'clipboard-outline',
  title,
  subtitle,
  ctaText,
  onCtaPress,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const iconFloat = useSharedValue(0);
  const glowPulse = useSharedValue(0.15);
  const ctaScale = useSharedValue(1);

  useEffect(() => {
    // Floating icon animation
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      ),
      -1,
      true
    );
    // Glow pulse
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 2000 }),
        withTiming(0.15, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat.value }],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={styles.container}
    >
      {/* Glow ring */}
      <Animated.View style={[styles.glowRing, { borderColor: colors.primary }, glowAnimStyle]} />

      {/* Floating icon */}
      <Animated.View
        style={[
          styles.iconCircle,
          { backgroundColor: colors.primary + '12' },
          iconAnimStyle,
        ]}
      >
        <Ionicons name={icon} size={44} color={colors.primary} />
      </Animated.View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      )}

      {/* CTA Button */}
      {ctaText && onCtaPress && (
        <Animated.View style={ctaAnimStyle}>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primary }, Shadow.glowSm]}
            onPressIn={() => { ctaScale.value = withSpring(0.9, AnimConfig.springBouncy); }}
            onPressOut={() => { ctaScale.value = withSpring(1, AnimConfig.springBouncy); }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCtaPress();
            }}
            activeOpacity={1}
          >
            <Ionicons name="add-circle" size={18} color="#fff" />
            <Text style={styles.ctaText}>{ctaText}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  glowRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    top: Spacing.xxl - 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  ctaText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});
