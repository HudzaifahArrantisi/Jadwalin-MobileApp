// ============================================
// Jadwalin App — Forgot Password (BEIGE EDITION v2)
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
import { resetPassword } from '@/services/auth.service';
import { Colors, Spacing, FontSize, Radius, sw, Shadow, SCREEN_WIDTH } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

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

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      setIsSent(true);
      Alert.alert(
        'Berhasil! ✉️',
        'Tautan reset password telah dikirim ke email kamu. Silakan cek inbox atau folder spam.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      let message = 'Terjadi kesalahan';
      if (error.code === 'auth/invalid-email') message = 'Format email tidak valid';
      else if (error.code === 'auth/user-not-found') message = 'Email tidak terdaftar';
      Alert.alert('Gagal', message);
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
                <Ionicons name="key-outline" size={sw(34)} color={Colors.white} />
              </View>
            </Animated.View>
            <View style={styles.waveCurve} />
          </View>

          {/* ── Form Section ── */}
          <View style={styles.formSection}>
            {/* Back Button */}
            <Animated.View entering={FadeIn.delay(100).duration(300)}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={sw(22)} color={Colors.brownDark} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(200).duration(500)}>
              <Text style={styles.formTitle}>Lupa Password</Text>
              <Text style={styles.formSubtitle}>
                Masukkan alamat email yang terdaftar.{'\n'}
                Kami akan mengirimkan tautan untuk mereset kata sandi kamu.
              </Text>
            </Animated.View>

            {/* Success State */}
            {isSent && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={sw(22)} color={Colors.checkGreen} />
                <Text style={styles.successText}>
                  Tautan reset telah dikirim! Cek email kamu.
                </Text>
              </Animated.View>
            )}

            {/* Email Input */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={styles.inputWrapper}
            >
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="email@contoh.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={(text) => { setEmail(text); setIsSent(false); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            {/* Send Link Button */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginTop: Spacing.lg }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleSendReset}
                disabled={isLoading}
                activeOpacity={1}
                style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={sw(18)} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>Kirim Tautan</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

          {/* ── Bottom Wave Section ── */}
          <View style={styles.bottomWave}>
            <View style={styles.bottomWaveCurve} />
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.bottomContent}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.toggleRow}
              >
                <Text style={styles.toggleText}>Ingat password? </Text>
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
    paddingTop: sw(60),
    paddingBottom: sw(50),
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  logoCircle: {
    width: sw(72),
    height: sw(72),
    borderRadius: sw(36),
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
    flex: 1,
    zIndex: 0,
  },
  backButton: {
    width: sw(40),
    height: sw(40),
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
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
    marginBottom: Spacing.xl,
    lineHeight: sw(22),
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#E8F5E9',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.checkGreen,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
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
    minHeight: sw(120),
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
