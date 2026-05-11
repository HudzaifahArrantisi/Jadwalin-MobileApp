// ============================================
// Jadwalin App — TaskList Component (Pro)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import { Task } from '@/types/task.types';
import { useTheme } from '@/hooks/useTheme';
import { FontSize, Spacing, BorderRadius } from '@/constants/colors';

interface TaskListProps {
  title: string;
  tasks: Task[];
  onToggle: (taskId: string, currentStatus: string) => void;
  onPress: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  emptyMessage?: string;
  emptyIcon?: string;
  showEmpty?: boolean;
  onCtaPress?: () => void;
}

export default function TaskList({
  title,
  tasks,
  onToggle,
  onPress,
  onDelete,
  emptyMessage = 'Belum ada task',
  emptyIcon = 'clipboard-outline',
  showEmpty = true,
  onCtaPress,
}: TaskListProps) {
  const { colors } = useTheme();

  if (tasks.length === 0 && !showEmpty) return null;

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primary + '18' },
          ]}
        >
          <Text style={[styles.countText, { color: colors.primary }]}>
            {tasks.length}
          </Text>
        </View>
      </View>

      {tasks.length === 0 ? (
        <EmptyState
          icon={emptyIcon as any}
          title={emptyMessage}
          subtitle="Tap + untuk menambahkan task baru"
          ctaText={onCtaPress ? 'Tambah Task' : undefined}
          onCtaPress={onCtaPress}
        />
      ) : (
        tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            index={index}
            onToggle={onToggle}
            onPress={onPress}
            onDelete={onDelete}
          />
        ))
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
});
