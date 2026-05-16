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
  FadeInDown, FadeIn,
} from 'react-native-reanimated';
import { resetPassword } from '@/services/auth.service';
import { Colors, Spacing, FontSize, sw, Shadow, Radius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PURPLE = '#7C3AED';
const LIGHT_GREY = '#484848ff';

export default function ForgotPasswordScreen() {
  const router = useRouter();

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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.topHeader}>
            <View style={styles.topHeaderBackground}>
              <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.headerTitle}>
                Forgot
              </Animated.Text>
            </View>
            <View style={styles.topHeaderCurve} />
          </View>

          <View style={styles.formSection}>
            <Animated.View entering={FadeIn.delay(100).duration(300)}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={sw(22)} color={PURPLE} />
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.formSubtitle}>Masukkan email untuk mereset kata sandi.</Text>

            {isSent && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={sw(22)} color={Colors.checkGreen} />
                <Text style={styles.successText}>Tautan reset telah dikirim!</Text>
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.inputWrapper}>
              <View style={[styles.inputContainer, { borderWidth: 1, borderColor: PURPLE, backgroundColor: Colors.white }]}>
                <Ionicons name="mail-outline" size={sw(18)} color={PURPLE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or mobile"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => { setEmail(text); setIsSent(false); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={{ marginTop: Spacing.xl }}>
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
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Link</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomWaveDecor}>
        <View style={styles.bottomWaveCurve} />
        <View style={styles.bottomWaveBg} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: sw(120),
  },
  topHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: sw(30),
  },
  topHeaderBackground: {
    backgroundColor: PURPLE,
    width: '100%',
    height: sw(180),
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: sw(40),
    borderBottomLeftRadius: SCREEN_WIDTH * 0.25,
    borderBottomRightRadius: SCREEN_WIDTH * 0.25,
    transform: [{ scaleX: 1.2 }],
  },
  topHeaderCurve: {
    position: 'absolute',
    bottom: -sw(40),
    width: sw(100),
    height: sw(100),
    backgroundColor: Colors.white,
    borderRadius: sw(50),
  },
  headerTitle: {
    fontSize: sw(42),
    fontWeight: 'bold',
    color: Colors.white,
    transform: [{ scaleX: 0.83 }],
  },
  formSection: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: Spacing.lg,
  },
  backButton: {
    width: sw(44),
    height: sw(44),
    borderRadius: 22,
    backgroundColor: LIGHT_GREY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
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
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: Spacing.lg,
    height: sw(56),
    backgroundColor: LIGHT_GREY,
  },
  inputIcon: {
    marginRight: Spacing.md,
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
    height: sw(56),
    backgroundColor: PURPLE,
    borderRadius: 999,
    ...Shadow.md,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: 'bold',
  },
  bottomWaveDecor: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: sw(100),
    justifyContent: 'flex-end',
  },
  bottomWaveBg: {
    backgroundColor: PURPLE,
    height: sw(80),
    borderTopLeftRadius: SCREEN_WIDTH * 0.25,
    borderTopRightRadius: SCREEN_WIDTH * 0.25,
    transform: [{ scaleX: 1.2 }],
  },
  bottomWaveCurve: {
    position: 'absolute',
    bottom: sw(40),
    alignSelf: 'center',
    width: sw(120),
    height: sw(120),
    backgroundColor: Colors.white,
    borderRadius: sw(60),
    zIndex: 1,
  },
});
