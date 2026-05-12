// ============================================
// Jadwalin App — Register Screen (BEIGE EDITION v2)
// Curved wave design with warm tones
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { registerWithEmail } from '@/services/auth.service';
import { Colors, Spacing, FontSize, Radius, sw, Shadow, SCREEN_WIDTH } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Animations
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 12 });
    logoOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Nama lengkap wajib diisi');
      return;
    }
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password wajib diisi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);
    try {
      await registerWithEmail(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Terjadi kesalahan';
      if (error.code === 'auth/invalid-email') message = 'Email tidak valid';
      else if (error.code === 'auth/email-already-in-use') message = 'Email sudah terdaftar';
      else if (error.code === 'auth/weak-password') message = 'Password terlalu lemah';
      Alert.alert('Registrasi Gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Wave Section (Beige) ── */}
          <View style={styles.topWave}>
            <Animated.View style={[styles.logoContainer, logoAnim]}>
              <View style={styles.logoCircle}>
                <Ionicons name="calendar" size={sw(32)} color={Colors.white} />
              </View>
            </Animated.View>
            <View style={styles.waveCurve} />
          </View>

          {/* ── Form Section ── */}
          <View style={styles.formSection}>
            <Animated.View entering={FadeIn.delay(200).duration(500)}>
              <Text style={styles.formTitle}>Buat Akun</Text>
              <Text style={styles.formSubtitle}>
                Daftarkan dirimu untuk mulai{'\n'}mengelola jadwalmu
              </Text>
            </Animated.View>

            {/* Full Name */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@contoh.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            {/* Password */}
            <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={sw(20)}
                    color={Colors.brown}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Confirm Password */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Konfirmasi Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ulangi password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={sw(20)}
                    color={Colors.brown}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Create Account Button */}
            <Animated.View entering={FadeInDown.delay(550).duration(400)} style={{ marginTop: Spacing.md }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={1}
                style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Buat Akun</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

          {/* ── Bottom Wave Section ── */}
          <View style={styles.bottomWave}>
            <View style={styles.bottomWaveCurve} />
            <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.bottomContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.toggleRow}
              >
                <Text style={styles.toggleText}>Sudah punya akun? </Text>
                <Text style={styles.toggleLink}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ─── Top Wave ───
  topWave: {
    backgroundColor: Colors.beige,
    paddingTop: sw(50),
    paddingBottom: sw(40),
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCircle: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  waveCurve: {
    position: 'absolute',
    bottom: -sw(30),
    left: 0,
    right: 0,
    height: sw(60),
    backgroundColor: Colors.beige,
    borderBottomLeftRadius: SCREEN_WIDTH * 0.5,
    borderBottomRightRadius: SCREEN_WIDTH * 0.5,
    zIndex: 1,
  },

  // ─── Form ───
  formSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: sw(36),
    zIndex: 0,
  },
  formTitle: {
    fontSize: sw(28),
    fontWeight: '800',
    color: Colors.brownDark,
    marginBottom: sw(6),
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: sw(22),
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    height: sw(52),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    height: '100%',
    color: Colors.textPrimary,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(52),
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.xl,
    ...Shadow.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── Bottom Wave ───
  bottomWave: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: sw(100),
    backgroundColor: Colors.beige,
    marginTop: sw(30),
    position: 'relative',
  },
  bottomWaveCurve: {
    position: 'absolute',
    top: -sw(30),
    left: 0,
    right: 0,
    height: sw(60),
    backgroundColor: Colors.beige,
    borderTopLeftRadius: SCREEN_WIDTH * 0.5,
    borderTopRightRadius: SCREEN_WIDTH * 0.5,
  },
  bottomContent: {
    paddingBottom: sw(40),
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    fontSize: FontSize.md,
    color: Colors.brown,
  },
  toggleLink: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.brownDark,
    textDecorationLine: 'underline',
  },
});
