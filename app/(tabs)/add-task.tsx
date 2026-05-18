// ============================================
// Jadwalin App — Add Task (Hidden tab redirect)
// This screen is accessed from Calendar's form
// ============================================

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

import { useAppTheme } from '@/constants/theme';

export default function AddTaskScreen() {
  const router = useRouter();
  const { Colors } = useAppTheme();
  const styles = getStyles(Colors);

  useEffect(() => {
    // Redirect to calendar page since add task is now
    // integrated into the calendar page
    router.replace('/(tabs)/calendar');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textMuted,
  },
});
