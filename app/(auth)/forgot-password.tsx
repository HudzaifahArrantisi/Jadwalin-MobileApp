import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resetPassword } from '@/services/auth.service';
import { useAppTheme, Spacing, FontSize, sw, Shadow, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PURPLE = '#8B5CF6';
const LIGHT_PURPLE = '#A78BFA';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { Colors } = useAppTheme();
  
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const buttonScale = useSharedValue(1);

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
      Alert.alert('Berhasil! ✉️', 'Tautan reset password telah dikirim.', [{ text: 'OK' }]);
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
      {/* Decorative top wave */}
      <View style={styles.topWaveDecor} />

      {/* Elegant Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.backButton, { top: insets.top + sw(10) }]}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={sw(22)} color={Colors.white} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.headerSection, { paddingTop: insets.top + sw(60) }]}>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.headerTitle}>
              Forgot Password
            </Animated.Text>
          </View>

          <View style={styles.formSection}>
            <Animated.Text entering={FadeInDown.delay(250).duration(400)} style={styles.formSubtitle}>
              Masukkan email terdaftar Anda. Kami akan mengirimkan tautan untuk mereset kata sandi.
            </Animated.Text>

            {isSent && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={sw(22)} color={Colors.white} />
                <Text style={styles.successText}>Tautan reset telah dikirim ke email Anda!</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={sw(18)} color={PURPLE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="rgba(139, 92, 246, 0.5)"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setIsSent(false); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginTop: Spacing.lg }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                  onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  onPress={handleSendReset}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={PURPLE} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Link</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Decorative bottom wave */}
      <View style={styles.bottomWaveDecor}>
        <View style={styles.bottomWaveCurveBg} />
        <View style={styles.bottomWaveCurveFg} />
      </View>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
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
  backButton: {
    position: 'absolute',
    left: Spacing.xl,
    zIndex: 10,
    width: sw(44),
    height: sw(44),
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: sw(80),
  },
  headerSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: sw(20),
  },
  headerTitle: {
    fontSize: sw(38),
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 1,
  },
  formSection: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.xl,
    lineHeight: sw(22),
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
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
    backgroundColor: '#4C1D95',
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
});
