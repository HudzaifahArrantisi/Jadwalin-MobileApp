import { useEffect, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { requestNotificationPermission } from '@/services/notification.service';
import { useAppTheme } from '@/constants/theme';
import OfflineIndicator from '@/components/OfflineIndicator';

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
  const { Colors, isDark } = useAppTheme();

  const [appReady, setAppReady] = useState(false);

  // Load Inter font family
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
  });

  const [showSplash, setShowSplash] = useState(true);

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

  // Hide native splash, handle navigation, and start custom splash fade-out
  useEffect(() => {
    if (!appReady) return;

    // Hide the native splash screen immediately so our animated one takes over
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

    // Keep our beautiful animated splash overlay visible for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, [appReady, isAuthenticated, segments]);

  // Don't render until ready - keep background solid purple to prevent color flash
  if (!appReady) {
    return (
      <View style={[styles.loading, { backgroundColor: '#6A3DE8' }]} />
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
      <StatusBar style={isDark ? "light" : "dark"} />
      <View pointerEvents="none" style={styles.offlineIndicator}>
        <OfflineIndicator />
      </View>

      {showSplash && (
        <Animated.View
          exiting={FadeOut.duration(500)}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#6A3DE8',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
            },
          ]}
        >
          <Animated.Image
            entering={FadeIn.delay(200).duration(800)}
            source={require('../assets/images/spalsh.png')}
            style={{ width: 260, height: 260, resizeMode: 'contain' }}
          />
          <Animated.Text
            entering={FadeIn.delay(500).duration(800)}
            style={{
              marginTop: 5,
              fontSize: 30,
              fontFamily: 'PlusJakartaSans-Medium',
              color: '#ffffffff',
              letterSpacing: -0.5,
            }}
          >
            Jadwalin
          </Animated.Text>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
  },
  offlineIndicator: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    zIndex: 100000,
    alignItems: 'center',
  },
});
