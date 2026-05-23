import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView,
  Dimensions, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { signInWithEmail, signInWithGoogle } from '@/services/auth.service';
import { useAppTheme, Colors, Spacing, FontSize, Radius, sw, Shadow } from '@/constants/theme';
import { Env } from '@/constants/env';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Required for web-based auth redirects to complete properly
WebBrowser.maybeCompleteAuthSession();

const PURPLE = '#8B5CF6';
const LIGHT_PURPLE = '#A78BFA';

export default function LoginScreen() {
  const router = useRouter();
  const { Colors, isDark } = useAppTheme();
  
  const PURPLE_DYNAMIC = Colors.brownDark;
  const LIGHT_PURPLE_DYNAMIC = isDark ? Colors.taskPurple : '#A78BFA';
  const styles = React.useMemo(() => getStyles(Colors, PURPLE_DYNAMIC, LIGHT_PURPLE_DYNAMIC), [Colors, isDark]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Custom Error Modal State
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('Gagal');
  const [errorMessage, setErrorMessage] = useState('');

  const showError = (message: string, title = 'Gagal') => {
    setErrorMessage(message);
    setErrorTitle(title);
    setErrorModalVisible(true);
  };

  const buttonScale = useSharedValue(1);

  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const isAndroid = Platform.OS === 'android';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Env.GOOGLE_WEB_CLIENT_ID,
    webClientId: Env.GOOGLE_WEB_CLIENT_ID,
    redirectUri: 'https://auth.expo.io/@candalena/JadwalinApp',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleCredential(id_token);
      }
    } else if (response?.type === 'error') {
      showError(response.error?.message || 'Terjadi kesalahan', 'Google Sign-In Gagal');
      setIsGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleCredential = async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Firebase Google Sign-In error:', error);
      showError(error.message || 'Terjadi kesalahan saat sign-in dengan Google.', 'Google Sign-In Gagal');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error: any) {
      showError(error.message || 'Tidak dapat memulai Google Sign-In', 'Error');
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError('Email dan password wajib diisi', 'Input Tidak Lengkap');
      return;
    }
    if (password.length < 6) {
      showError('Password minimal 6 karakter', 'Password Terlalu Pendek');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/invalid-email') {
        message = 'Format email tidak valid.';
      } else if (
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Email atau password salah. Coba lagi.';
      } else {
        message = error.message || 'Terjadi kesalahan.';
      }
      showError(message, 'Login Gagal');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Decorative top wave */}
      <View style={styles.topWaveDecor} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerSection}>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.headerTitle}>
              Log In
            </Animated.Text>
          </View>

          <View style={styles.formSection}>
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={sw(18)} color={PURPLE_DYNAMIC} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="User name or email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={sw(18)} color={PURPLE_DYNAMIC} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={sw(20)} color={PURPLE_DYNAMIC} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.rememberForgotRow}>
              <Text style={styles.rememberText}>Remember me</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ marginTop: Spacing.xl }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                  onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={PURPLE_DYNAMIC} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Log In</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            {isAndroid && (
              <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.socialLoginContainer}>
                <Text style={styles.socialLoginText}>Log IN with</Text>
                <TouchableOpacity
                  style={[styles.googleButton, { opacity: (isGoogleLoading || !request) ? 0.7 : 1 }]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.7}
                  disabled={isGoogleLoading || isLoading || !request}
                >
                  {isGoogleLoading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Ionicons name="logo-google" size={sw(20)} color={Colors.white} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
            
            <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.footerRow}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.toggleRow}>
                <Text style={styles.toggleText}>{"Don't have an account? "}</Text>
                <Text style={styles.toggleLink}>Sign Up</Text>
              </TouchableOpacity>
            </Animated.View>
            
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Decorative bottom wave */}
      <View style={styles.bottomWaveDecor}>
        <View style={styles.bottomWaveCurveBg} />
        <View style={styles.bottomWaveCurveFg} />
      </View>

      {/* Custom Error Popup Modal */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInDown.duration(300).springify()}
            style={styles.modalContent}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={sw(32)} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>{errorTitle}</Text>
            <Text style={styles.modalMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setErrorModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any, PURPLE: string, LIGHT_PURPLE: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PURPLE,
    position: 'relative',
  },
  topWaveDecor: {
    position: 'absolute',
    top: -SCREEN_WIDTH * 0.2,
    right: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_WIDTH * 0.8,
    borderRadius: SCREEN_WIDTH * 0.4,
    backgroundColor: LIGHT_PURPLE,
    opacity: 0.5,
  },
  bottomWaveDecor: {
    position: 'absolute',
    bottom: -sw(60),
    width: SCREEN_WIDTH,
    height: sw(150),
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomWaveCurveBg: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: sw(180),
    backgroundColor: '#4C1D95', // Darker purple
    borderTopLeftRadius: SCREEN_WIDTH,
    borderTopRightRadius: SCREEN_WIDTH,
    transform: [{ scaleX: 1.2 }],
    bottom: sw(20),
  },
  bottomWaveCurveFg: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: sw(150),
    backgroundColor: Colors.white,
    borderTopLeftRadius: SCREEN_WIDTH,
    borderTopRightRadius: SCREEN_WIDTH,
    transform: [{ scaleX: 1.2 }, { translateX: SCREEN_WIDTH * 0.1 }],
    bottom: -sw(50),
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: sw(60),
  },
  headerSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: sw(80),
    paddingBottom: sw(40),
  },
  headerTitle: {
    fontSize: sw(46),
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  formSection: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 500, // Tablet support
    alignSelf: 'center',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999, // Pill shape
    paddingHorizontal: Spacing.lg,
    height: sw(56),
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    height: '100%',
    color: PURPLE,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -Spacing.xs,
  },
  rememberText: {
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  forgotText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: sw(56),
    backgroundColor: Colors.white,
    borderRadius: 999,
    ...Shadow.md,
  },
  primaryButtonText: {
    color: PURPLE,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: sw(30),
    gap: Spacing.md,
  },
  socialLoginText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  googleButton: {
    width: sw(44),
    height: sw(44),
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: sw(30),
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
  },
  toggleLink: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: sw(320),
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow.lg,
  },
  errorIconContainer: {
    width: sw(64),
    height: sw(64),
    borderRadius: sw(32),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: Spacing.xs,
  },
  modalMessage: {
    fontSize: FontSize.md,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: sw(20),
  },
  modalButton: {
    width: '100%',
    height: sw(48),
    backgroundColor: PURPLE,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
});
