// ============================================
// Jadwalin App — Offline Indicator
// ============================================

import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/taskStore';
import { BorderRadius, FontSize, Spacing } from '@/constants/colors';

export default function OfflineIndicator() {
  const isOffline = useTaskStore((s) => s.isOffline);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isOffline) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [isOffline]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={styles.container}
    >
      <Animated.View style={[styles.dot, dotStyle]} />
      <Ionicons name="cloud-offline-outline" size={14} color="#F59E0B" />
      <Text style={styles.text}>Mode Offline</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  text: {
    color: '#F59E0B',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
