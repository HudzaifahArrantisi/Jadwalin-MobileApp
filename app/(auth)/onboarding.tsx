// ============================================
// Jadwalin App — Onboarding Screen (BEIGE EDITION)
// Only shown to first-time users
// ============================================

import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle, withRepeat, withSequence, withTiming,
  withSpring, FadeIn, FadeInDown, interpolate, Extrapolation,
  useSharedValue, SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '@/store/taskStore';
import { Colors, Spacing, FontSize, Radius, sw, sh, SCREEN_WIDTH, SCREEN_HEIGHT } from '@/constants/theme';

interface OnboardingSlide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
}

const PURPLE = '#7C3AED';
const LIGHT_PURPLE = '#8B5CF6';
const DARK_PURPLE = '#6D28D9';
const WHITE = '#FFFFFF';

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'calendar',
    bgColor: '#EEDEFF', // Light pastel purple
    accentColor: PURPLE,
    title: 'Atur Jadwalmu\nDengan Mudah',
    subtitle: 'Tambah jadwal, tugas, dan pertemuan hanya dengan beberapa ketukan. Pilih tanggal, atur waktu, selesai!',
  },
  {
    id: '2',
    icon: 'notifications',
    bgColor: '#F3E8FF',
    accentColor: LIGHT_PURPLE,
    title: 'Tidak Ada\nYang Terlewat',
    subtitle: 'Jadwalin mengingatkanmu secara otomatis sebelum deadline tiba. Kamu akan selalu siap.',
  },
  {
    id: '3',
    icon: 'rocket',
    bgColor: '#F5F3FF',
    accentColor: DARK_PURPLE,
    title: 'Produktif\nSetiap Hari',
    subtitle: 'Dashboard intuitif, kalender visual, dan catatan pribadi membantumu tetap terorganisir dan fokus.',
  },
];

function SlideItem({ item, index, scrollX }: { item: OnboardingSlide; index: number; scrollX: SharedValue<number> }) {
  const iconFloat = useSharedValue(0);

  useEffect(() => {
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ), -1, true
    );
  }, []);

  const iconAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: iconFloat.value }],
  }));

  const contentAnim = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    return {
      opacity: interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP) },
        { scale: interpolate(scrollX.value, inputRange, [0.85, 1, 0.85], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View style={[slideStyles.slide, { width: SCREEN_WIDTH }]}>
      <Animated.View style={[slideStyles.content, contentAnim]}>
        {/* Icon container */}
        <Animated.View style={iconAnim}>
          <View style={[slideStyles.iconCircle, { backgroundColor: item.bgColor }]}>
            <Ionicons name={item.icon} size={sw(52)} color={item.accentColor} />
          </View>
        </Animated.View>

        {/* Decorative dots */}
        <View style={slideStyles.dotsDecor}>
          <View style={[slideStyles.decorDot, { backgroundColor: item.bgColor, width: sw(8), height: sw(8) }]} />
          <View style={[slideStyles.decorDot, { backgroundColor: item.bgColor, width: sw(5), height: sw(5), opacity: 0.6 }]} />
        </View>

        {/* Text */}
        <Text style={slideStyles.title}>{item.title}</Text>
        <Text style={slideStyles.subtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const slideStyles = StyleSheet.create({
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: sw(32),
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    width: sw(120),
    height: sw(120),
    borderRadius: sw(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sw(32),
  },
  dotsDecor: {
    position: 'absolute',
    top: sw(10),
    right: sw(-20),
    gap: sw(6),
  },
  decorDot: {
    borderRadius: 999,
  },
  title: {
    fontSize: sw(28),
    fontWeight: '800',
    color: Colors.brownDark,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: sw(36),
    marginBottom: sw(14),
  },
  subtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: sw(22),
    paddingHorizontal: sw(8),
  },
});

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setHasSeenOnboarding = useTaskStore((s) => s.setHasSeenOnboarding);

  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(newIndex);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex(activeIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    router.replace('/(auth)/login');
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip Button */}
      <Animated.View entering={FadeIn.delay(400).duration(400)} style={styles.skipWrap}>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.6}>
          <Text style={styles.skipText}>Lewati</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: activeIndex === i ? sw(28) : sw(8),
                  backgroundColor: activeIndex === i ? Colors.brownDark : Colors.beigeDark,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          style={[
            styles.ctaBtn,
            isLastSlide && styles.ctaBtnLast,
          ]}
        >
          <Text style={styles.ctaBtnText}>
            {isLastSlide ? 'Mulai Sekarang' : 'Lanjut'}
          </Text>
          <Ionicons
            name={isLastSlide ? 'arrow-forward' : 'chevron-forward'}
            size={sw(18)}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  skipWrap: {
    position: 'absolute',
    top: sw(56),
    right: Spacing.lg,
    zIndex: 10,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: sw(6),
    marginBottom: Spacing.lg,
  },
  dot: {
    height: sw(8),
    borderRadius: sw(4),
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(54),
    gap: Spacing.sm,
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.xl,
  },
  ctaBtnLast: {
    backgroundColor: Colors.brown,
  },
  ctaBtnText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
