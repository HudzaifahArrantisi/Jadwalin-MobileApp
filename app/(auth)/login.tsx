import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import * as Haptics from 'expo-haptics';
import { signInWithEmail, signInWithGoogle } from '@/services/auth.service';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';
import { Env } from '@/constants/env';
import InteractivePressable from '@/components/InteractivePressable';



WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { Colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthNonce, setOauthNonce] = useState('');

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'jadwalinapp' }),
    []
  );
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Env.GOOGLE_WEB_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
      extraParams: oauthNonce ? { nonce: oauthNonce } : {},
    },
    discovery
  );

  useEffect(() => {
    let isActive = true;
    const generateNonce = async () => {
      const bytes = await Crypto.getRandomBytesAsync(16);
      const nonce = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
      if (isActive) {
        setOauthNonce(nonce);
      }
    };

    generateNonce();
    return () => {
      isActive = false;
    };
  }, []);

  const handleGoogleCredential = useCallback(async (idToken: string) => {
    try {
      await signInWithGoogle(idToken);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Google Sign-In Gagal', error.message || 'Terjadi kesalahan.');
    } finally {
      setIsGoogleLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (idToken) {
        handleGoogleCredential(idToken);
      } else {
        Alert.alert('Google Sign-In Gagal', 'Google tidak mengembalikan ID token.');
        setIsGoogleLoading(false);
      }
      return;
    }

    if (response.type !== 'dismiss' && response.type !== 'cancel') {
      Alert.alert('Google Sign-In Gagal', 'Tidak dapat memulai Google Sign-In.');
    }
    setIsGoogleLoading(false);
  }, [response, handleGoogleCredential]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Input belum lengkap', 'Email dan password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password pendek', 'Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.code === 'auth/invalid-email'
          ? 'Format email tidak valid.'
          : error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential'
            ? 'Email atau password salah. Coba lagi.'
            : error.message || 'Terjadi kesalahan.';
      Alert.alert('Login gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!Env.GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Google Sign-In Gagal', 'GOOGLE_WEB_CLINET_ID belum diatur.');
      return;
    }
    if (!request) {
      Alert.alert('Google Sign-In Gagal', 'Permintaan login Google belum siap.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Gagal', error.message || 'Tidak dapat memulai Google Sign-In.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>JADWALIN</Text>
          <Text style={styles.title}>Log In</Text>
          <Text style={styles.subtitle}>Masuk untuk menata hari dengan lebih tenang.</Text>

          <View style={styles.form}>
            <View style={[styles.inputShell, focusedField === 'email' && styles.inputFocused]}>
              <Ionicons name="mail-outline" size={sw(18)} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputShell, focusedField === 'password' && styles.inputFocused]}>
              <Ionicons name="lock-closed-outline" size={sw(18)} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
              />
              <InteractivePressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={sw(20)} color={Colors.textMuted} />
              </InteractivePressable>
            </View>

            <View style={styles.linkRow}>
              <InteractivePressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.linkText}>Lupa password?</Text>
              </InteractivePressable>
            </View>

            <InteractivePressable style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.primaryButtonText}>Masuk</Text>}
            </InteractivePressable>

            {Platform.OS === 'android' ? (
              <InteractivePressable style={[styles.secondaryButton, isGoogleLoading && styles.buttonDisabled]} onPress={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <ActivityIndicator color={Colors.textPrimary} /> : <Ionicons name="logo-google" size={sw(18)} color={Colors.textPrimary} />}
                <Text style={styles.secondaryButtonText}>Masuk dengan Google</Text>
              </InteractivePressable>
            ) : null}
          </View>

          <InteractivePressable style={styles.footerLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerText}>Belum punya akun? <Text style={styles.footerStrong}>Daftar</Text></Text>
          </InteractivePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
  brand: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 3, marginBottom: Spacing.lg, textAlign: 'center' },
  title: { fontSize: FontSize.title, color: Colors.textPrimary, fontWeight: '300', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: sw(21), textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  inputShell: { minHeight: sw(56), borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputFocused: { borderColor: Colors.brownDark, borderWidth: 1.5 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, height: '100%' },
  linkRow: { alignItems: 'flex-end' },
  linkText: { color: Colors.brownDark, fontSize: FontSize.sm, fontWeight: '600' },
  primaryButton: { minHeight: sw(54), borderRadius: Radius.md, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: Colors.textLight, fontSize: FontSize.md, fontWeight: '700' },
  secondaryButton: { minHeight: sw(52), borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm },
  secondaryButtonText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  buttonDisabled: { opacity: 0.55 },
  footerLink: { marginTop: Spacing.xl, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerStrong: { color: Colors.brownDark, fontWeight: '700' },
});
