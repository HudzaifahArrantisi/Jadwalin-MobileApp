// ============================================
// Jadwalin App — Root Layout (BEIGE EDITION)
// ============================================

import { useEffect, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { requestNotificationPermission } from '@/services/notification.service';
import { Colors } from '@/constants/theme';

// Ignore harmless Firebase connectivity warnings in development
LogBox.ignoreLogs([
  'WebChannelConnection RPC',
  'BloomFilter error',
]);

// Keep splash visible while loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasSeenOnboarding = useTaskStore((s) => s.hasSeenOnboarding);

  const [appReady, setAppReady] = useState(false);

  // Load Inter font family
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // App initialization
  useEffect(() => {
    async function prepare() {
      try {
        // Request notification permissions
        await requestNotificationPermission();
      } catch (e) {
        console.warn('Prepare error:', e);
      }
    }
    prepare();
  }, []);

  // Mark app ready when everything is loaded
  useEffect(() => {
    if (fontsLoaded && !isAuthLoading) {
      setAppReady(true);
    }
  }, [fontsLoaded, isAuthLoading]);

  // Hide splash and navigate
  useEffect(() => {
    if (!appReady) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // First launch → onboarding, otherwise → login
      if (!hasSeenOnboarding) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(auth)/login');
      }
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [appReady, isAuthenticated, segments]);

  // Don't render until ready
  if (!appReady) {
    return (
      <View style={[styles.loading, { backgroundColor: Colors.cream }]} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
});
