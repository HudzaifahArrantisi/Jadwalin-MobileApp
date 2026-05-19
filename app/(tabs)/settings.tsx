// halaman setting.tex 
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, Platform, KeyboardAvoidingView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, FadeIn, 
  Layout, useSharedValue, 
  useAnimatedStyle, withSpring 
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { auth, db } from '@/services/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { useAppTheme, Spacing, FontSize, Radius, Shadow, sw, sh, SCREEN_WIDTH } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { setUser, themeMode, toggleTheme } = useTaskStore();
  const tasks = useTaskStore(state => state.tasks);
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const { Colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [job, setJob] = useState(user?.job || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isEditing, setIsEditing] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const displayPhoto = localPhotoUri || user?.photoURL;

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setJob(user?.job || '');
    setAddress(user?.address || '');
    setLocalPhotoUri(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Nama tidak boleh kosong'); return; }
    
    if (user) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (auth.currentUser) {
          const profileUpdates: any = { displayName: name.trim() };
          const photoToSave = localPhotoUri || user.photoURL;
          
          // Firebase Auth photoURL has length limits. Do not send base64 strings to updateProfile.
          if (photoToSave && !photoToSave.startsWith('data:image')) {
            profileUpdates.photoURL = photoToSave;
          }

          await updateProfile(auth.currentUser, profileUpdates);
        }
        
        await setDoc(doc(db, 'users', user.uid), {
          name: name.trim(),
          job: job.trim() || null,
          address: address.trim() || null,
          photoURL: localPhotoUri || user.photoURL,
        }, { merge: true });

        setUser({
          ...user,
          name: name.trim(),
          job: job.trim() || undefined,
          address: address.trim() || undefined,
          photoURL: localPhotoUri || user.photoURL,
        });

        setIsEditing(false);
        setLocalPhotoUri(null);
        Alert.alert('Berhasil', 'Profil berhasil diperbarui');
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Gagal memperbarui profil: ' + err.message);
      }
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan akses ke galeri foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].base64) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalPhotoUri(base64Uri);
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih foto');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan akses kamera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });

      if (!result.canceled && result.assets[0] && result.assets[0].base64) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setLocalPhotoUri(base64Uri);
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const handlePhotoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Ubah Foto Profil', 'Pilih sumber foto', [
      { text: 'Kamera', onPress: handleTakePhoto },
      { text: 'Galeri', onPress: handlePickPhoto },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Logout', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: sw(120) }}
          keyboardShouldPersistTaps="handled">
          
          {/* Profile Header */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.profileHeader}>
            <View style={styles.headerBackground} />
            <Animated.View 
              entering={FadeInDown.delay(100).springify()}
              style={styles.avatarContainer}
            >
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={sw(40)} color={Colors.cream} />
                </View>
              )}
              <InteractivePressable style={styles.editPhotoBtn} onPress={handlePhotoPress}>
                <Ionicons name="camera" size={sw(16)} color={Colors.white} />
              </InteractivePressable>
            </Animated.View>
            <View style={styles.profileInfoBlock}>
              <Text style={styles.profileName}>{user?.name || 'Pengguna'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={styles.formSection}>
            <View style={styles.formCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="person-outline" size={sw(18)} color={Colors.white} />
                </View>
                <Text style={styles.sectionTitle}>Informasi Personal</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nama Lengkap</Text>
                <TextInput style={styles.input} value={name}
                  onChangeText={(text) => { setName(text); setIsEditing(true); }}
                  placeholder="Masukkan nama lengkap" placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput style={[styles.input, { backgroundColor: Colors.cream }]} value={email}
                  editable={false}
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Pekerjaan</Text>
                <TextInput style={styles.input} value={job}
                  onChangeText={(text) => { setJob(text); setIsEditing(true); }}
                  placeholder="Opsional" placeholderTextColor={Colors.textMuted} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Alamat Lengkap</Text>
                <TextInput style={[styles.input, styles.textArea]} value={address}
                  onChangeText={(text) => { setAddress(text); setIsEditing(true); }}
                  placeholder="Opsional" placeholderTextColor={Colors.textMuted}
                  multiline numberOfLines={3} textAlignVertical="top" />
              </View>

              {isEditing && (
                <Animated.View 
                  entering={FadeInDown.duration(300).springify()} 
                  layout={Layout.springify()}
                  style={styles.buttonRow}
                >
                  <InteractivePressable style={styles.cancelBtn} onPress={handleCancel}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </InteractivePressable>
                  <InteractivePressable style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  </InteractivePressable>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Statistics Section */}
          <Animated.View entering={FadeInDown.delay(225).duration(400).springify()} style={styles.formSection}>
            <View style={styles.formCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="stats-chart-outline" size={sw(18)} color={Colors.white} />
                </View>
                <Text style={styles.sectionTitle}>Statistik & Histori</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>Jadwal Diselesaikan</Text>
                  <Text style={styles.settingDesc}>Total jadwal yang telah sukses dilakukan</Text>
                </View>
                <View style={styles.statsBadge}>
                  <Text style={styles.statsBadgeText}>{completedTasksCount}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Preferences Section */}
          <Animated.View entering={FadeInDown.delay(250).duration(400).springify()} style={styles.formSection}>
            <View style={styles.formCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name="settings-outline" size={sw(18)} color={Colors.white} />
                </View>
                <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextWrap}>
                  <Text style={styles.settingLabel}>Tema Gelap</Text>
                  <Text style={styles.settingDesc}>Aktifkan mode gelap (Dark Mode)</Text>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleTheme}
                  trackColor={{ false: Colors.inputBorder, true: Colors.brownDark }}
                  thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : Colors.cream}
                  ios_backgroundColor={Colors.inputBorder}
                />
              </View>
            </View>
          </Animated.View>

          {/* Logout Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} style={styles.logoutSection}>
            <InteractivePressable style={styles.logoutBtn} onPress={handleLogout} hapticType={Haptics.ImpactFeedbackStyle.Medium}>
              <View style={styles.logoutIconWrapper}>
                <Ionicons name="log-out-outline" size={sw(22)} color={Colors.danger} />
              </View>
              <Text style={styles.logoutText}>Keluar dari Akun</Text>
              <Ionicons name="chevron-forward" size={sw(18)} color={Colors.textMuted} />
            </InteractivePressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  
  // Header styles
  profileHeader: {
    alignItems: 'center', 
    paddingTop: sw(40),
    paddingBottom: Spacing.xl,
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '60%',
    backgroundColor: Colors.beige,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  avatarContainer: { 
    position: 'relative', 
    marginBottom: Spacing.md,
    ...Shadow.md,
  },
  avatar: { 
    width: sw(100), height: sw(100), borderRadius: sw(50), 
    borderWidth: 4, borderColor: Colors.white,
    backgroundColor: Colors.cream,
  },
  avatarPlaceholder: {
    width: sw(100), height: sw(100), borderRadius: sw(50), 
    backgroundColor: Colors.brownDark,
    alignItems: 'center', justifyContent: 'center', 
    borderWidth: 4, borderColor: Colors.white,
  },
  editPhotoBtn: {
    position: 'absolute', bottom: sw(2), right: sw(2), 
    width: sw(32), height: sw(32),
    borderRadius: sw(16), backgroundColor: Colors.brownDark, 
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.white,
    ...Shadow.sm,
  },
  profileInfoBlock: { alignItems: 'center' },
  profileName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.brownDark, marginBottom: sw(2) },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  
  // Form styles
  formSection: { paddingHorizontal: Spacing.lg, zIndex: 1, marginBottom: Spacing.lg },
  formCard: { 
    backgroundColor: Colors.profileFormBg || Colors.white, borderRadius: Radius.xxl, 
    padding: Spacing.lg, ...Shadow.md,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionHeader: { 
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, 
    borderBottomWidth: 1, borderBottomColor: Colors.inputBorder,
    paddingBottom: Spacing.md, marginBottom: Spacing.lg,
  },
  sectionIconWrap: {
    width: sw(32), height: sw(32),
    borderRadius: sw(12),
    backgroundColor: Colors.brownDark,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: sw(14), fontSize: FontSize.md, color: Colors.textPrimary,
  },
  textArea: { minHeight: sw(80), paddingTop: Spacing.md },
  
  // Buttons
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.brownDark, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: sw(12) },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.brownDark },
  saveBtn: { flex: 1, backgroundColor: Colors.brownDark, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: sw(12), ...Shadow.sm },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  
  // Settings row
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  settingTextWrap: { flex: 1, paddingRight: Spacing.md },
  settingLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  settingDesc: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: sw(2),
  },
  statsBadge: {
    backgroundColor: Colors.brownDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(6),
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  
  // Logout styles
  logoutSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.profileFormBg || Colors.white,
    borderRadius: Radius.xl, padding: Spacing.md, ...Shadow.sm,
  },
  logoutIconWrapper: { 
    width: sw(40), height: sw(40), borderRadius: Radius.lg, 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoutText: { flex: 1, fontSize: FontSize.md, fontWeight: '600', color: Colors.danger },
});
