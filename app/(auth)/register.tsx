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
import { registerWithEmail } from '@/services/auth.service';
import { Colors, Spacing, FontSize, sw, Shadow } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PURPLE = '#7C3AED';
const LIGHT_GREY = '#F3F4F6';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const buttonScale = useSharedValue(1);

  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.topHeader}>
            <View style={styles.topHeaderBackground}>
              <Animated.Text entering={FadeInDown.delay(200).duration(500)} style={styles.headerTitle}>
                Sign Up
              </Animated.Text>
            </View>
            <View style={styles.topHeaderCurve} />
          </View>

          <View style={styles.formSection}>
            <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.inputWrapper}>
              <View style={[styles.inputContainer, { borderWidth: 1, borderColor: PURPLE, backgroundColor: Colors.white }]}>
                <Ionicons name="mail-outline" size={sw(18)} color={PURPLE} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or mobile"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).duration(400)} style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={sw(18)} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="User name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={sw(18)} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={sw(20)} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.rememberForgotRow}>
              <Text style={styles.rememberText}>Remember me</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(550).duration(400)} style={{ marginTop: Spacing.xl }}>
              <Animated.View style={btnAnim}>
                <TouchableOpacity
                  onPressIn={() => { buttonScale.value = withSpring(0.97); }}
                  onPressOut={() => { buttonScale.value = withSpring(1); }}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.9}
                  style={[styles.primaryButton, { opacity: isLoading ? 0.7 : 1 }]}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>SignUp</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(650).duration(400)} style={styles.footerRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.toggleRow}>
                <Text style={styles.toggleText}>Already have an account? </Text>
                <Text style={styles.toggleLink}>Log IN</Text>
              </TouchableOpacity>
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
    paddingBottom: sw(120), // Leave room for bottom wave
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
    transform: [{ scaleX: 0.83 }], // counteract scaleX of parent
  },
  formSection: {
    paddingHorizontal: Spacing.xl,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    marginTop: Spacing.xl,
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
  rememberForgotRow: {
    alignItems: 'center',
    marginTop: -Spacing.xs,
  },
  rememberText: {
    color: Colors.textPrimary,
    fontSize: FontSize.sm,
    fontWeight: 'bold',
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
  footerRow: {
    marginTop: sw(30),
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  toggleLink: {
    color: Colors.textPrimary,
    fontSize: FontSize.md,
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
