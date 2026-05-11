// ============================================
// Jadwalin App — Profile Screen (BEIGE EDITION)
// Bug 9: Photo upload with expo-image-picker
// ============================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '@/services/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { Colors, Spacing, FontSize, Radius, Shadow, sw, sh, SCREEN_WIDTH } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { setUser } = useTaskStore();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [job, setJob] = useState(user?.job || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isEditing, setIsEditing] = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const displayPhoto = localPhotoUri || user?.photoURL;

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setJob(user?.job || '');
    setAddress(user?.address || '');
    setLocalPhotoUri(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Nama tidak boleh kosong'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Email tidak boleh kosong'); return; }

    if (user) {
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: name.trim(),
            photoURL: localPhotoUri || user.photoURL,
          });
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
        Alert.alert('Berhasil', 'Profil berhasil diperbarui');
      } catch (err: any) {
        Alert.alert('Error', 'Gagal memperbarui profil: ' + err.message);
      }
    }
  };

  // Bug 9: Pick photo from gallery
  const handlePickPhoto = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan akses ke galeri foto untuk mengubah foto profil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalPhotoUri(result.assets[0].uri);
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memilih foto');
    }
  };

  // Bug 9: Take photo with camera
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
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setLocalPhotoUri(result.assets[0].uri);
        setIsEditing(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil foto');
    }
  };

  const handlePhotoPress = () => {
    Alert.alert('Ubah Foto Profil', 'Pilih sumber foto', [
      { text: 'Kamera', onPress: handleTakePhoto },
      { text: 'Galeri', onPress: handlePickPhoto },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleLogout = () => {
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
          
          {/* Profile Header (Elegant Redesign) */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.profileHeader}>
            <View style={styles.headerBackground} />
            <View style={styles.avatarContainer}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={sw(40)} color={Colors.cream} />
                </View>
              )}
              <TouchableOpacity style={styles.editPhotoBtn} activeOpacity={0.8} onPress={handlePhotoPress}>
                <Ionicons name="camera" size={sw(16)} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfoBlock}>
              <Text style={styles.profileName}>{user?.name || 'Pengguna'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formSection}>
            <View style={styles.formCard}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={sw(20)} color={Colors.brownDark} />
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
                  editable={false} // Email typically shouldn't be editable directly without reauth
                  placeholder="Masukkan email" placeholderTextColor={Colors.textMuted}
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
                <Animated.View entering={FadeInDown.duration(300)} style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Logout Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.logoutIconWrapper}>
                <Ionicons name="log-out-outline" size={sw(22)} color={Colors.danger} />
              </View>
              <Text style={styles.logoutText}>Keluar dari Akun</Text>
              <Ionicons name="chevron-forward" size={sw(18)} color={Colors.textMuted} />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  formSection: { paddingHorizontal: Spacing.lg, zIndex: 1 },
  formCard: { 
    backgroundColor: Colors.white, borderRadius: Radius.xl, 
    padding: Spacing.lg, ...Shadow.md,
  },
  sectionHeader: { 
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, 
    borderBottomWidth: 1, borderBottomColor: Colors.inputBorder,
    paddingBottom: Spacing.md, marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  fieldGroup: { marginBottom: Spacing.lg },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: Colors.cream, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: sw(14), fontSize: FontSize.md, color: Colors.textPrimary,
  },
  textArea: { minHeight: sw(80), paddingTop: Spacing.md },
  
  // Buttons
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.brownDark, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: sw(12) },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.brownDark },
  saveBtn: { flex: 1, backgroundColor: Colors.brownDark, borderRadius: Radius.lg, alignItems: 'center', paddingVertical: sw(12), ...Shadow.sm },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  
  // Logout styles
  logoutSection: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xl },
  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
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
