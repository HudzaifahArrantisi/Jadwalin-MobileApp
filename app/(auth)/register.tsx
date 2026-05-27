import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { registerWithEmail } from '@/services/auth.service';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { Colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Input belum lengkap', 'Nama, email, dan password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password pendek', 'Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await registerWithEmail(email.trim(), password, name.trim());
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.code === 'auth/invalid-email'
          ? 'Email tidak valid.'
          : error.code === 'auth/email-already-in-use'
            ? 'Email sudah terdaftar.'
            : error.code === 'auth/username-already-in-use'
              ? 'Username sudah digunakan. Coba nama lain.'
            : error.code === 'auth/weak-password'
              ? 'Password terlalu lemah.'
              : error.message || 'Terjadi kesalahan.';
      Alert.alert('Registrasi gagal', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <InteractivePressable onPress={() => router.back()} style={[styles.backButton, { top: insets.top + Spacing.md }]}>
        <Ionicons name="arrow-back" size={sw(21)} color={Colors.textPrimary} />
      </InteractivePressable>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.brand}>JADWALIN</Text>
          <Text style={styles.title}>Sign Up</Text>
          <Text style={styles.subtitle}>Buat ruang planner pribadi yang rapi dan mudah dibaca.</Text>

          <View style={styles.form}>
            <View style={[styles.inputShell, focusedField === 'name' && styles.inputFocused]}>
              <Ionicons name="person-outline" size={sw(18)} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Nama lengkap"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>
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

            <InteractivePressable style={[styles.primaryButton, isLoading && styles.buttonDisabled]} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color={Colors.textLight} /> : <Text style={styles.primaryButtonText}>Daftar</Text>}
            </InteractivePressable>
          </View>

          <InteractivePressable style={styles.footerLink} onPress={() => router.back()}>
            <Text style={styles.footerText}>Sudah punya akun? <Text style={styles.footerStrong}>Masuk</Text></Text>
          </InteractivePressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.cream },
  backButton: { position: 'absolute', left: Spacing.xl, zIndex: 10, width: sw(40), height: sw(40), borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
  brand: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 3, marginBottom: Spacing.lg, textAlign: 'center' },
  title: { fontSize: FontSize.title, color: Colors.textPrimary, fontWeight: '300', letterSpacing: 2, textAlign: 'center' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: sw(21), textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.xl },
  form: { gap: Spacing.md },
  inputShell: { minHeight: sw(56), borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputFocused: { borderColor: Colors.brownDark, borderWidth: 1.5 },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, height: '100%' },
  primaryButton: { minHeight: sw(54), borderRadius: Radius.md, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md },
  primaryButtonText: { color: Colors.textLight, fontSize: FontSize.md, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
  footerLink: { marginTop: Spacing.xl, alignItems: 'center' },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.sm },
  footerStrong: { color: Colors.brownDark, fontWeight: '700' },
});
