import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Image, Platform, Switch, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { syncLeaderboardProfile } from '@/services/gamification.service';
import { useAuth } from '@/hooks/useAuth';
import { useTaskStore } from '@/store/taskStore';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

function MenuRow({
  icon,
  label,
  description,
  right,
  danger,
  onPress,
}: {
  icon: string;
  label: string;
  description?: string;
  right?: React.ReactNode;
  danger?: boolean;
  onPress?: () => void;
}) {
  const { Colors } = useAppTheme();
  return (
    <InteractivePressable style={[styles.menuRow, { borderBottomColor: Colors.borderLight }]} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: danger ? 'rgba(168,73,73,0.10)' : Colors.inputBg, borderColor: Colors.borderLight }]}>
        <Ionicons name={icon as any} size={sw(18)} color={danger ? Colors.danger : Colors.textSecondary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: danger ? Colors.danger : Colors.textPrimary }]}>{label}</Text>
        {description ? <Text style={[styles.rowDesc, { color: Colors.textMuted }]}>{description}</Text> : null}
      </View>
      {right || <Ionicons name="chevron-forward" size={sw(17)} color={Colors.textMuted} />}
    </InteractivePressable>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { setUser, themeMode, toggleTheme, showToast } = useTaskStore();
  const tasks = useTaskStore((state) => state.tasks);
  const { Colors } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [job, setJob] = useState(user?.job || '');
  const [address, setAddress] = useState(user?.address || '');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);

  const completedTasksCount = tasks.filter((task) => task.status === 'completed').length;
  const displayPhoto = localPhotoUri || user?.photoURL;

  const pickPhoto = async () => {
    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!result.granted) {
      Alert.alert('Izin diperlukan', 'Aplikasi membutuhkan akses galeri foto.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.25,
      base64: true,
    });

    if (!picked.canceled && picked.assets[0]?.base64) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLocalPhotoUri(`data:image/jpeg;base64,${picked.assets[0].base64}`);
      setShowEdit(true);
    }
  };

  const saveProfile = async () => {
    if (!name.trim() || !user) {
      Alert.alert('Nama kosong', 'Nama tidak boleh kosong.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (auth.currentUser) {
        const profileUpdates: any = { displayName: name.trim() };
        const photoToSave = localPhotoUri || user.photoURL;
        if (photoToSave && !photoToSave.startsWith('data:image')) {
          profileUpdates.photoURL = photoToSave;
        }
        await updateProfile(auth.currentUser, profileUpdates);
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          name: name.trim(),
          displayName: name.trim(),
          job: job.trim() || null,
          address: address.trim() || null,
          photoURL: localPhotoUri || user.photoURL,
        },
        { merge: true }
      );

      setUser({ ...user, name: name.trim(), job: job.trim() || undefined, address: address.trim() || undefined, photoURL: localPhotoUri || user.photoURL });
      await syncLeaderboardProfile(user.uid, name.trim(), localPhotoUri || user.photoURL);
      setLocalPhotoUri(null);
      setShowEdit(false);
      showToast('Profil berhasil diperbarui');
    } catch (error: any) {
      Alert.alert('Gagal', error.message || 'Profil gagal disimpan.');
    }
  };

  const confirmLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Keluar akun', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={screenStyles.content}>
        <View style={screenStyles.header}>
          <Text style={screenStyles.kicker}>PENGATURAN</Text>
          <Text style={screenStyles.title}>Profil</Text>
        </View>

        <View style={screenStyles.profileBlock}>
          <InteractivePressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Ganti foto profil">
            <View style={screenStyles.avatarWrapper}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={screenStyles.avatar} />
              ) : (
                <View style={screenStyles.avatarPlaceholder}>
                  <Text style={screenStyles.avatarInitial}>{(user?.name || 'J').charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={screenStyles.avatarBadge}>
                <Ionicons name="camera" size={sw(14)} color={Colors.textLight} />
              </View>
            </View>
          </InteractivePressable>
          <View style={screenStyles.profileCopy}>
            <Text style={screenStyles.profileName}>{user?.name || 'Pengguna'}</Text>
            <Text style={screenStyles.profileEmail}>{user?.email || 'Email belum tersedia'}</Text>
          </View>
        </View>

        <View style={screenStyles.group}>
          <MenuRow icon="person-outline" label="Informasi Personal" description={job || address || 'Lengkapi detail profil'} onPress={() => setShowEdit(true)} />
          <MenuRow
            icon="stats-chart-outline"
            label="Jadwal Diselesaikan"
            description="Total agenda yang sudah ditandai selesai"
            right={<Text style={screenStyles.countBadge}>{completedTasksCount}</Text>}
          />
        </View>

        <View style={screenStyles.group}>
          <MenuRow
            icon="moon-outline"
            label="Tema Gelap"
            description="Obsidian black premium edition"
            right={
              <Switch
                value={themeMode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: Colors.inputBorder, true: Colors.checkGreen }}
                thumbColor={Platform.OS === 'ios' ? Colors.white : Colors.cream}
                ios_backgroundColor={Colors.inputBorder}
              />
            }
          />
        </View>

        <View style={screenStyles.group}>
          <MenuRow icon="log-out-outline" label="Keluar akun" description="Akhiri sesi saat ini" danger onPress={confirmLogout} />
        </View>
      </ScrollView>

      <Modal visible={showEdit} transparent animationType="slide" onRequestClose={() => setShowEdit(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={screenStyles.modalKeyboard}>
          <View style={screenStyles.overlay}>
            <Animated.View 
              entering={FadeInDown.duration(260)}
              style={[
                screenStyles.sheet, 
                { 
                  maxHeight: '80%', 
                  paddingBottom: Math.max(insets.bottom, Spacing.xl)
                }
              ]}
            >
              <View style={screenStyles.sheetTop}>
                <Text style={screenStyles.sheetTitle}>Informasi Personal</Text>
                <InteractivePressable onPress={() => setShowEdit(false)}>
                  <Ionicons name="close" size={sw(22)} color={Colors.textPrimary} />
                </InteractivePressable>
              </View>

              <ScrollView 
                keyboardShouldPersistTaps="handled" 
                showsVerticalScrollIndicator={false} 
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ paddingBottom: Spacing.xl }}
              >
                <Text style={screenStyles.label}>Nama</Text>
                <TextInput style={screenStyles.input} value={name} onChangeText={setName} placeholder="Nama lengkap" placeholderTextColor={Colors.textMuted} />
                <Text style={screenStyles.label}>Pekerjaan</Text>
                <TextInput style={screenStyles.input} value={job} onChangeText={setJob} placeholder="Opsional" placeholderTextColor={Colors.textMuted} />
                <Text style={screenStyles.label}>Alamat</Text>
                <TextInput style={[screenStyles.input, screenStyles.textArea]} value={address} onChangeText={setAddress} placeholder="Opsional" placeholderTextColor={Colors.textMuted} multiline textAlignVertical="top" />
                <InteractivePressable style={screenStyles.saveButton} onPress={saveProfile}>
                  <Text style={screenStyles.saveText}>Simpan</Text>
                </InteractivePressable>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuRow: { minHeight: sw(72), flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingVertical: Spacing.sm },
  rowIcon: { width: sw(38), height: sw(38), borderRadius: Radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rowText: { flex: 1, paddingRight: Spacing.md },
  rowLabel: { fontSize: FontSize.md, fontWeight: '600' },
  rowDesc: { fontSize: FontSize.xs, lineHeight: sw(17), marginTop: sw(2) },
});

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: sw(132) },
  header: { marginBottom: Spacing.xl },
  kicker: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.title, color: Colors.textPrimary, fontWeight: '700' },
  profileBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  avatarWrapper: { width: sw(72), height: sw(72), justifyContent: 'center' },
  avatar: { width: sw(72), height: sw(72), borderRadius: sw(36), borderWidth: 1, borderColor: Colors.borderLight },
  avatarPlaceholder: { width: sw(72), height: sw(72), borderRadius: sw(36), backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: Colors.textLight, fontSize: FontSize.xxl, fontWeight: '600' },
  avatarBadge: {
    position: 'absolute',
    right: sw(-2),
    bottom: sw(-2),
    width: sw(26),
    height: sw(26),
    borderRadius: sw(13),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.cream,
  },
  profileCopy: { flex: 1, marginLeft: Spacing.md },
  profileName: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  profileEmail: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs },
  group: { backgroundColor: Colors.profileFormBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderLight, paddingHorizontal: Spacing.md, marginBottom: Spacing.lg, overflow: 'hidden' },
  countBadge: { color: Colors.brownDark, fontSize: FontSize.lg, fontWeight: '700' },
  modalKeyboard: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.profileFormBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  label: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { minHeight: sw(50), borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, backgroundColor: Colors.inputBg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },
  textArea: { minHeight: sw(92), paddingTop: Spacing.md },
  saveButton: { marginTop: Spacing.xl, minHeight: sw(52), borderRadius: Radius.md, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: Colors.textLight, fontSize: FontSize.md, fontWeight: '700' },
});
