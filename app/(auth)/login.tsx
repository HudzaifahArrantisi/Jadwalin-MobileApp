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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { signInWithEmail, signInWithGoogle } from '@/services/auth.service';
import { Colors, Spacing, FontSize, Radius, sw, Shadow, SCREEN_WIDTH } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email dan password wajib diisi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Terjadi kesalahan';
      if (error.code === 'auth/invalid-email') message = 'Email tidak valid';
      else if (error.code === 'auth/user-not-found') message = 'Akun tidak ditemukan';
      else if (error.code === 'auth/wrong-password') message = 'Password salah';
      else if (error.code === 'auth/invalid-credential') message = 'Email atau password salah';
      Alert.alert('Login Gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Configure Google Sign-In on mount
  useEffect(() => {
    GoogleSignin.configure({
      // webClientId from Firebase Console > Authentication > Sign-in method > Google
      // This is the "Web client ID" (NOT Android client ID)
      webClientId: '55725704462-sbcnip5b0o9rqvck360ak16g4hm7qrfc.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      // Get the idToken from the sign-in result
      const idToken = signInResult?.data?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In berhasil tapi tidak mendapat token.');
      }

      // Pass idToken to Firebase auth
      await signInWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled — do nothing
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Info', 'Proses sign-in sedang berjalan...');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services tidak tersedia di perangkat ini.');
      } else {
        console.error('Google Sign-In error:', error);
        Alert.alert('Google Sign-In Gagal', error.message || 'Terjadi kesalahan saat sign-in dengan Google.');
      }
    } finally {
      setIsGoogleLoading(false);
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
                <Ionicons name="calendar" size={sw(36)} color={Colors.white} />
                <Text style={{ color: Colors.white, fontSize: sw(10), fontWeight: 'bold', marginTop: sw(2) }}>Jadwalin</Text>
              </View>
            </Animated.View>
            {/* Curved bottom edge */}
            <View style={styles.waveCurve} />
          </View>

          {/* ── Form Section (White/Cream) ── */}
          <View style={styles.formSection}>
            <Animated.View entering={FadeIn.delay(200).duration(500)}>
              <Text style={styles.formTitle}>Login</Text>
              <Text style={styles.formSubtitle}>
                Selamat datang kembali,{'\n'}
                Masuk untuk melanjutkan jadwalmu
              </Text>
            </Animated.View>

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
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(400)}
              style={styles.inputWrapper}
            >
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotLink}>Lupa password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={sw(18)} color={Colors.brown} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
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

            {/* Sign In Button */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ marginTop: Spacing.lg }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                onPressOut={() => { buttonScale.value = withSpring(1); }}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={1}
                style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Divider */}
            <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>atau</Text>
              <View style={styles.divider} />
            </Animated.View>

            {/* Google Sign In */}
            <Animated.View entering={FadeInDown.delay(650).duration(400)}>
              <TouchableOpacity
                style={[styles.googleButton, { opacity: isGoogleLoading ? 0.7 : 1 }]}
                onPress={handleGoogleSignIn}
                activeOpacity={0.7}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator color={Colors.brownDark} size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={sw(18)} color={Colors.brownDark} />
                    <Text style={styles.googleButtonText}>Masuk dengan Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── Bottom Wave Section (Beige) ── */}
          <View style={styles.bottomWave}>
            <View style={styles.bottomWaveCurve} />
            <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.bottomContent}>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
                style={styles.toggleRow}
              >
                <Text style={styles.toggleText}>Belum punya akun? </Text>
                <Text style={styles.toggleLink}>Buat akun</Text>
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
    paddingTop: sw(40),
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
    marginBottom: Spacing.xl,
    lineHeight: sw(22),
  },
  inputWrapper: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotLink: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.brownDark,
    marginBottom: Spacing.xs,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
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
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  googleButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.brownDark,
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
