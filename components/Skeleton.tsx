// ============================================
// Jadwalin App — Skeleton Loader Component
// ============================================

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const { colors } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.shimmer,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/** Skeleton placeholder for a task item card */
export function TaskSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[skStyles.taskCard, { backgroundColor: colors.surface }]}>
      <SkeletonBox width={22} height={22} borderRadius={11} />
      <View style={skStyles.taskContent}>
        <SkeletonBox width="70%" height={14} />
        <SkeletonBox width="45%" height={10} style={{ marginTop: 6 }} />
        <SkeletonBox width="30%" height={8} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

/** Skeleton placeholder for the dashboard header */
export function HeaderSkeleton() {
  return (
    <View style={skStyles.headerWrap}>
      <View>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={140} height={22} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={44} height={44} borderRadius={22} />
    </View>
  );
}

/** Multiple task skeletons */
export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={skStyles.listWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </View>
  );
}

export { SkeletonBox };

const skStyles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  taskContent: {
    flex: 1,
  },
  headerWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  listWrap: {
    paddingTop: Spacing.md,
  },
});
