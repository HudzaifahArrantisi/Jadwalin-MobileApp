// ============================================
// Jadwalin App — Animated TaskItem (Swipeable)
// ============================================

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInRight,
  FadeOutLeft,
  Layout,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Task, TASK_CATEGORY_LABELS, TASK_CATEGORY_COLORS } from '@/types/task.types';
import { BorderRadius, FontSize, Shadow, Spacing, AnimConfig } from '@/constants/colors';

interface TaskItemProps {
  task: Task;
  index: number;
  onToggle: (taskId: string, currentStatus: string) => void;
  onPress: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const SWIPE_THRESHOLD = 80;

// Helper to safely parse dates from Firebase Timestamps or AsyncStorage JSON
const parseTaskDate = (dateField: any): Date | null => {
  if (!dateField) return null;
  if (typeof dateField.toDate === 'function') return dateField.toDate();
  if (typeof dateField.seconds === 'number') return new Date(dateField.seconds * 1000);
  if (dateField instanceof Date) return dateField;
  if (typeof dateField === 'string' || typeof dateField === 'number') return new Date(dateField);
  return null;
};

function TaskItemComponent({
  task,
  index,
  onToggle,
  onPress,
  onDelete,
}: TaskItemProps) {
  const { colors, isDark } = useTheme();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const isCompleted = task.status === 'completed';
  const deadline = parseTaskDate(task.date);
  const isOverdue =
    deadline && deadline < new Date() && task.status === 'pending';

  const formattedDate = deadline
    ? deadline.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  const formattedTime = deadline
    ? deadline.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const statusColor = isOverdue
    ? colors.danger
    : isCompleted
    ? colors.success
    : colors.primary;

  // ─── Haptic Helpers ───
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Hapus Task',
      `Yakin ingin menghapus "${task.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => onDelete?.(task.id),
        },
      ]
    );
  }, [task.id, task.title, onDelete]);

  const triggerComplete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(task.id, task.status);
  }, [task.id, task.status, onToggle]);

  // ─── Swipe Gesture ───
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD && onDelete) {
        // Swipe left → Delete
        runOnJS(triggerDelete)();
      } else if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right → Complete
        runOnJS(triggerComplete)();
      }
      translateX.value = withSpring(0, AnimConfig.spring);
    });

  // ─── Long Press ───
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      scale.value = withSpring(0.97, AnimConfig.spring);
      runOnJS(triggerHaptic)();
      runOnJS(onPress)(task);
    })
    .onEnd(() => {
      scale.value = withSpring(1, AnimConfig.spring);
    });

  const tapGesture = Gesture.Tap()
    .onStart(() => {
      scale.value = withSpring(0.98, AnimConfig.spring);
    })
    .onEnd(() => {
      scale.value = withSpring(1, AnimConfig.spring);
      runOnJS(triggerHaptic)();
      runOnJS(onPress)(task);
    });

  const composedGesture = Gesture.Race(
    panGesture,
    Gesture.Exclusive(longPressGesture, tapGesture)
  );

  // ─── Animated Styles ───
  const animatedContainer = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const deleteAction = useAnimatedStyle(() => ({
    opacity: translateX.value < -30 ? withTiming(1) : withTiming(0),
  }));

  const completeAction = useAnimatedStyle(() => ({
    opacity: translateX.value > 30 ? withTiming(1) : withTiming(0),
  }));

  const handleCheckPress = useCallback(() => {
    checkScale.value = withSpring(0.7, AnimConfig.springBouncy, () => {
      checkScale.value = withSpring(1, AnimConfig.springBouncy);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(task.id, task.status);
  }, [task.id, task.status, onToggle]);

  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 60).duration(400).springify()}
      exiting={FadeOutLeft.duration(300)}
      layout={Layout.springify()}
      style={styles.wrapper}
    >
      {/* Background Actions */}
      <View style={styles.actionsContainer}>
        <Animated.View style={[styles.completeAction, completeAction]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={[styles.actionLabel, { color: colors.success }]}>Selesai</Text>
        </Animated.View>
        <Animated.View style={[styles.deleteAction, deleteAction]}>
          <Text style={[styles.actionLabel, { color: colors.danger }]}>Hapus</Text>
          <Ionicons name="trash" size={24} color={colors.danger} />
        </Animated.View>
      </View>

      {/* Card */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderLeftColor: statusColor,
            },
            animatedContainer,
          ]}
        >
          {/* Checkbox */}
          <TouchableOpacity
            onPress={handleCheckPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.View
              style={[
                styles.checkbox,
                {
                  borderColor: statusColor,
                  backgroundColor: isCompleted ? statusColor : 'transparent',
                },
                checkAnimStyle,
              ]}
            >
              {isCompleted && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                {
                  color: isCompleted ? colors.textMuted : colors.text,
                  textDecorationLine: isCompleted ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={1}
            >
              {task.title}
            </Text>

            {task.description ? (
              <Text
                style={[styles.description, { color: colors.textDim }]}
                numberOfLines={1}
              >
                {task.description}
              </Text>
            ) : null}

            <View style={styles.meta}>
              <View style={styles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={isOverdue ? colors.danger : colors.textDim}
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: isOverdue ? colors.danger : colors.textDim },
                  ]}
                >
                  {formattedDate} • {formattedTime}
                </Text>
              </View>

              <View style={styles.badges}>
                {task.category && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: (TASK_CATEGORY_COLORS[task.category] || colors.primary) + '15' },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: TASK_CATEGORY_COLORS[task.category] || colors.primary }]}>
                      {TASK_CATEGORY_LABELS[task.category] || 'Task'}
                    </Text>
                  </View>
                )}
                {task.reminder && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.warning + '15' },
                    ]}
                  >
                    <Ionicons
                      name="notifications"
                      size={9}
                      color={colors.warning}
                    />
                  </View>
                )}
                {isOverdue && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.danger + '15' },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.danger }]}>
                      Overdue
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export default React.memo(TaskItemComponent);

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  completeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  deleteAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  description: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: FontSize.xxs,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
