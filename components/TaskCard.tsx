import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);

  // Fade animation saat toggle
  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    opacity.value = withTiming(0.5, { duration: 200 }, () => {
      opacity.value = withTiming(1, { duration: 200 });
    });
    onToggle(task.id);
  };

  // Swipe to delete gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -100) {
        // Delete threshold
        translateX.value = withTiming(-400, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
          runOnJS(onDelete)(task.id);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: task.completed ? 0.5 : 1,
    textDecorationLine: task.completed ? 'line-through' : 'none',
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedCardStyle]}>
        <Pressable
          style={styles.card}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`Task: ${task.title}`}
          accessibilityState={{ checked: task.completed }}
        >
          {/* Checkbox */}
          <Pressable
            style={[
              styles.checkbox,
              task.completed && styles.checkboxChecked,
            ]}
            onPress={handleToggle}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
          >
            {task.completed && (
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            )}
          </Pressable>

          {/* Task Title */}
          <Animated.Text style={[styles.title, animatedTextStyle]}>
            {task.title}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxChecked: {
    borderColor: Colors.checkGreen,
    backgroundColor: Colors.checkGreen,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
});
