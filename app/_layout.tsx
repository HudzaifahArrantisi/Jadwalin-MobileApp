import { useEffect, useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold 
} from '@expo-google-fonts/poppins';
import { Text, TextInput } from 'react-native';
import React from 'react';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { requestNotificationPermission } from '@/services/notification.service';
import { useAppTheme } from '@/constants/theme';
import OfflineIndicator from '@/components/OfflineIndicator';

// Map font weights to Poppins
const mapFontWeightToPoppins = (style: any) => {
  if (!style) return 'Poppins_400Regular';
  const flat = StyleSheet.flatten(style);
  if (!flat) return 'Poppins_400Regular';

  // If a custom fontFamily is specified (e.g. Ionicons or custom icons), do not override it
  if (flat.fontFamily && 
      flat.fontFamily !== 'Inter' && 
      flat.fontFamily !== 'Inter_400Regular' && 
      flat.fontFamily !== 'Inter_700Bold' && 
      flat.fontFamily !== 'Inter_500Medium' && 
      flat.fontFamily !== 'PlusJakartaSans-Medium') {
    return flat.fontFamily;
  }

  const weight = flat.fontWeight;
  if (weight === 'bold' || weight === '700') {
    return 'Poppins_700Bold';
  }
  if (weight === '800' || weight === '900') {
    return 'Poppins_800ExtraBold';
  }
  if (weight === '600') {
    return 'Poppins_600SemiBold';
  }
  if (weight === '500') {
    return 'Poppins_500Medium';
  }
  if (weight === '300' || weight === '200' || weight === '100') {
    return 'Poppins_300Light';
  }
  return 'Poppins_400Regular';
};

// Global text patch for Poppins font family
if ((Text as any).render) {
  const oldTextRender = (Text as any).render;
  (Text as any).render = function (...args: any[]) {
    const origin = oldTextRender.apply(this, args);
    const fontFamily = mapFontWeightToPoppins(origin.props.style);
    return React.cloneElement(origin, {
      style: [origin.props.style, { fontFamily }],
    });
  };
}

// Global text input patch for Poppins font family
if ((TextInput as any).render) {
  const oldTextInputRender = (TextInput as any).render;
  (TextInput as any).render = function (...args: any[]) {
    const origin = oldTextInputRender.apply(this, args);
    const fontFamily = mapFontWeightToPoppins(origin.props.style);
    return React.cloneElement(origin, {
      style: [origin.props.style, { fontFamily }],
    });
  };
}

// Ignore harmless Firebase connectivity warnings in development

LogBox.ignoreLogs([
  'WebChannelConnection RPC',
  'BloomFilter error',
  'expo-notifications: Android Push notifications',
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

  // Load Poppins font family
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    // Aliases to avoid breaking legacy code targeting these specific names
    'PlusJakartaSans-Medium': Poppins_500Medium,
    'Inter_400Regular': Poppins_400Regular,
    'Inter_500Medium': Poppins_500Medium,
    'Inter_600SemiBold': Poppins_600SemiBold,
    'Inter_700Bold': Poppins_700Bold,
    'Inter_800ExtraBold': Poppins_800ExtraBold,
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
              fontFamily: 'Poppins_500Medium',
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
