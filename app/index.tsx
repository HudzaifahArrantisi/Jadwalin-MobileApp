// ============================================
// Jadwalin App — Root Index (Splash Redirect)
// ============================================

import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function Index() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const hasSeenOnboarding = useTaskStore((s) => s.hasSeenOnboarding);
  const { colors } = useTheme();

  if (isAuthLoading) {
    return <View style={[styles.loading, { backgroundColor: colors.background }]} />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
