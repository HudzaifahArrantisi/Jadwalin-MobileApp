// ============================================
// Jadwalin App — Login Screen (BEIGE EDITION)
// Bug 10: Added name field for registration
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
  withTiming, withRepeat, withSequence, FadeInDown, FadeInUp,
} from 'react-native-reanimated';
import { signInWithEmail, registerWithEmail } from '@/services/auth.service';
import { Colors, Spacing, FontSize, Radius, sw, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password wajib diisi');
      return;
    }
    if (isRegister && !name.trim()) {
      Alert.alert('Error', 'Nama wajib diisi untuk registrasi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email.trim(), password, name.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Terjadi kesalahan';
      if (error.code === 'auth/invalid-email') message = 'Email tidak valid';
      else if (error.code === 'auth/user-not-found') message = 'Akun tidak ditemukan';
      else if (error.code === 'auth/wrong-password') message = 'Password salah';
      else if (error.code === 'auth/email-already-in-use') message = 'Email sudah terdaftar';
      else if (error.code === 'auth/invalid-credential') message = 'Email atau password salah';
      Alert.alert(isRegister ? 'Registrasi Gagal' : 'Login Gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    Alert.alert(
      'Google Sign-In',
      'Google Sign-In membutuhkan development build. Gunakan email/password untuk testing di Expo Go.',
      [{ text: 'OK' }]
    );
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
          {/* Top Section — Logo */}
          <View style={styles.topSection}>
            <Animated.View style={[styles.logoContainer, logoAnim]}>
              <View style={styles.logoIcon}>
                <Ionicons name="calendar" size={sw(32)} color={Colors.white} />
              </View>
              <Text style={styles.logoText}>Jadwalin</Text>
              <Text style={styles.tagline}>
                Atur jadwalmu, raih produktivitasmu
              </Text>
            </Animated.View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              <Text style={styles.formTitle}>
                {isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isRegister
                  ? 'Daftarkan akunmu untuk mulai'
                  : 'Masuk untuk mengelola jadwalmu'}
              </Text>
            </Animated.View>

            {/* Name Input (Only for Registration) */}
            {isRegister && (
              <Animated.View
                entering={FadeInDown.delay(250).duration(400)}
                style={styles.inputContainer}
              >
                <Ionicons name="person-outline" size={sw(18)} color={Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nama Lengkap"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </Animated.View>
            )}

            {/* Email Input */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(400)}
              style={styles.inputContainer}
            >
              <Ionicons name="mail-outline" size={sw(18)} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              entering={FadeInDown.delay(450).duration(400)}
              style={styles.inputContainer}
            >
              <Ionicons name="lock-closed-outline" size={sw(18)} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
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
                  size={sw(18)}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInDown.delay(550).duration(400)} style={btnAnim}>
              <TouchableOpacity
                onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleEmailAuth}
                disabled={isLoading}
                activeOpacity={1}
                style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={isRegister ? 'person-add' : 'log-in'}
                      size={sw(18)}
                      color={Colors.white}
                    />
                    <Text style={styles.primaryButtonText}>
                      {isRegister ? 'Daftar' : 'Masuk'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.divider} />
            </Animated.View>

            {/* Google Sign In */}
            <Animated.View entering={FadeInDown.delay(700).duration(400)}>
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                activeOpacity={0.7}
              >
                <Ionicons name="logo-google" size={sw(18)} color={Colors.textPrimary} />
                <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Toggle */}
            <Animated.View entering={FadeInDown.delay(800).duration(400)}>
              <TouchableOpacity
                onPress={() => {
                  setIsRegister(!isRegister);
                  setName('');
                }}
                style={styles.toggleRow}
              >
                <Text style={styles.toggleText}>
                  {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
                </Text>
                <Text style={styles.toggleLink}>
                  {isRegister ? 'Masuk' : 'Daftar'}
                </Text>
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
  // ─── Top ───
  topSection: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.beige,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
    minHeight: sw(200),
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(20),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  logoText: {
    fontSize: sw(34),
    fontWeight: '800',
    color: Colors.brownDark,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  // ─── Form ───
  formSection: {
    flex: 0.65,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.brownDark,
    marginBottom: sw(4),
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    height: sw(52),
    backgroundColor: Colors.white,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(52),
    gap: Spacing.sm,
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.inputBorder,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(52),
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  googleButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  toggleLink: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.brownDark,
  },
});
