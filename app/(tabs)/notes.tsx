import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNotes } from '@/hooks/useNotes';
import { NoteList } from '@/types/task.types';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

function notePreview(note: NoteList) {
  if (note.type === 'text' && note.content) return note.content;
  if (note.items?.length) return note.items.map((item) => item.text).join(' / ');
  return 'Belum ada isi.';
}

function NoteCard({
  note,
  index,
  onPress,
  onDelete,
}: {
  note: NoteList;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) {
  const { Colors } = useAppTheme();
  const palette = [Colors.pastelGreen, Colors.pastelRose, Colors.pastelOat, Colors.pastelBlue, Colors.pastelLavender];
  const height = sw(138 + Math.min(notePreview(note).length, 90) * 0.35 + (index % 3) * 18);

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(340)} layout={Layout.springify()}>
      <InteractivePressable
        style={[styles.noteCard, { minHeight: height, backgroundColor: palette[index % palette.length], borderColor: Colors.borderLight }]}
        onPress={onPress}
        onLongPress={onDelete}
      >
        <View style={styles.noteCardHeader}>
          <Text style={[styles.noteIndex, { color: Colors.textMuted }]}>{String(index + 1).padStart(2, '0')}</Text>
          <Ionicons name={note.type === 'text' ? 'document-text-outline' : 'list-outline'} size={sw(18)} color={Colors.textSecondary} />
        </View>
        <Text style={[styles.noteTitle, { color: Colors.textPrimary }]} numberOfLines={2}>
          {note.title}
        </Text>
        <Text style={[styles.notePreviewFirst, { color: Colors.textPrimary }]} numberOfLines={1}>
          {notePreview(note).split('/')[0].trim()}
        </Text>
        <Text style={[styles.notePreview, { color: Colors.textSecondary }]} numberOfLines={4}>
          {notePreview(note)}
        </Text>
      </InteractivePressable>
    </Animated.View>
  );
}

function DetailModal({
  note,
  visible,
  onClose,
  onUpdateContent,
  onToggleItem,
}: {
  note: NoteList | null;
  visible: boolean;
  onClose: () => void;
  onUpdateContent: (content: string) => void;
  onToggleItem: (itemId: string) => void;
}) {
  const { Colors } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');

  React.useEffect(() => {
    setContent(note?.content || '');
  }, [note]);

  if (!note) return null;

  const close = () => {
    if (note.type === 'text' && content !== note.content) onUpdateContent(content);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={[screenStyles.modalPage, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={screenStyles.modalTop}>
          <InteractivePressable onPress={close}>
            <Ionicons name="arrow-back" size={sw(22)} color={Colors.textPrimary} />
          </InteractivePressable>
          <Text style={screenStyles.modalKicker}>CATATAN</Text>
        </View>
        <Text style={screenStyles.detailTitle}>{note.title}</Text>
        {note.type === 'text' ? (
          <TextInput
            value={content}
            onChangeText={setContent}
            onBlur={() => onUpdateContent(content)}
            multiline
            textAlignVertical="top"
            placeholder="Mulai menulis..."
            placeholderTextColor={Colors.textMuted}
            style={screenStyles.detailInput}
          />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xxl }}>
            {note.items.map((item) => (
              <InteractivePressable key={item.id} style={screenStyles.detailItem} onPress={() => onToggleItem(item.id)}>
                <View style={[screenStyles.detailDot, item.completed && { backgroundColor: Colors.brownDark, borderColor: Colors.brownDark }]} />
                <Text style={[screenStyles.detailItemText, item.completed && { textDecorationLine: 'line-through', color: Colors.textMuted }]}>
                  {item.text}
                </Text>
              </InteractivePressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function CreateSheet({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, type: 'list' | 'text', content: string) => void;
}) {
  const { Colors } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'list' | 'text'>('text');
  const [content, setContent] = useState('');
  const insets = useSafeAreaInsets();

  const save = () => {
    if (!title.trim()) {
      Alert.alert('Judul kosong', 'Isi judul catatan dulu.');
      return;
    }
    onSave(title.trim(), type, content.trim());
    setTitle('');
    setContent('');
    setType('text');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              <Text style={screenStyles.sheetTitle}>Note Baru</Text>
              <InteractivePressable onPress={onClose}>
                <Ionicons name="close" size={sw(22)} color={Colors.textPrimary} />
              </InteractivePressable>
            </View>

            <ScrollView 
              keyboardShouldPersistTaps="handled" 
              showsVerticalScrollIndicator={false} 
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
            >
              <Text style={screenStyles.label}>Judul</Text>
              <TextInput style={screenStyles.input} value={title} onChangeText={setTitle} placeholder="Contoh: Ide minggu ini" placeholderTextColor={Colors.textMuted} />
              <View style={screenStyles.segment}>
                {(['text', 'list'] as const).map((item) => (
                  <InteractivePressable key={item} style={[screenStyles.segmentBtn, type === item && screenStyles.segmentActive]} onPress={() => setType(item)}>
                    <Text style={[screenStyles.segmentText, type === item && screenStyles.segmentTextActive]}>{item === 'text' ? 'Tulisan' : 'Checklist'}</Text>
                  </InteractivePressable>
                ))}
              </View>
              <Text style={screenStyles.label}>Isi</Text>
              <TextInput
                style={[screenStyles.input, screenStyles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder={type === 'list' ? 'Tulis item, pisahkan dengan baris baru' : 'Mulai menulis...'}
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <InteractivePressable style={screenStyles.saveButton} onPress={save}>
                <Text style={screenStyles.saveText}>Simpan</Text>
              </InteractivePressable>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function NotesScreen() {
  const { Colors } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const { notes, notesLoading, addNote, editNote, removeNote, toggleNoteItem } = useNotes();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteList | null>(null);

  const columns = useMemo(() => {
    return notes.reduce<[NoteList[], NoteList[]]>(
      (acc, note, index) => {
        acc[index % 2].push(note);
        return acc;
      },
      [[], []]
    );
  }, [notes]);

  const handleCreate = async (title: string, type: 'list' | 'text', content: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addNote({
      title,
      emoji: '',
      color: Colors.pastelOat,
      type,
      content: type === 'text' ? content : '',
      items:
        type === 'list'
          ? content
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
              .map((text, order) => ({ text, completed: false, order }))
          : [],
    });
    setShowCreate(false);
  };

  const confirmDelete = (note: NoteList) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Hapus catatan', `Hapus "${note.title}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => removeNote(note.id) },
    ]);
  };

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={screenStyles.header}>
        <View>
          <Text style={screenStyles.kicker}>DAFTAR SAYA</Text>
          <Text style={screenStyles.title}>Catatan</Text>
        </View>
        <InteractivePressable style={screenStyles.addButton} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={sw(20)} color={Colors.textLight} />
        </InteractivePressable>
      </View>

      {notesLoading ? <Text style={screenStyles.statusText}>Memuat catatan...</Text> : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={screenStyles.content}>
        {notes.length === 0 ? (
          <View style={screenStyles.emptyBox}>
            <Text style={screenStyles.emptyTitle}>Belum ada note.</Text>
            <Text style={screenStyles.emptyText}>Buat satu catatan kecil untuk ide, daftar belanja, atau rencana minggu ini.</Text>
          </View>
        ) : (
          <View style={screenStyles.masonry}>
            {columns.map((column, columnIndex) => (
              <View key={columnIndex} style={screenStyles.column}>
                {column.map((note, index) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    index={index * 2 + columnIndex}
                    onPress={() => setSelectedNote(note)}
                    onDelete={() => confirmDelete(note)}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <CreateSheet visible={showCreate} onClose={() => setShowCreate(false)} onSave={handleCreate} />
      <DetailModal
        visible={!!selectedNote}
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onUpdateContent={(content) => selectedNote && editNote(selectedNote.id, { content })}
        onToggleItem={(itemId) => selectedNote && toggleNoteItem(selectedNote.id, itemId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  noteCard: { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  noteIndex: { fontSize: FontSize.xxs, letterSpacing: 1.4 },
  noteTitle: { fontSize: FontSize.md, fontWeight: '700', lineHeight: sw(21) },
  notePreviewFirst: { fontSize: FontSize.sm, fontWeight: '600', marginTop: Spacing.md },
  notePreview: { fontSize: FontSize.xs, lineHeight: sw(18), marginTop: Spacing.xs },
});

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  header: { paddingHorizontal: Spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.title, color: Colors.textPrimary, fontWeight: '700' },
  addButton: { width: sw(38), height: sw(38), borderRadius: Radius.full, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: sw(132) },
  masonry: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  column: { flex: 1 },
  statusText: { paddingHorizontal: Spacing.xl, marginTop: Spacing.md, color: Colors.textMuted, fontSize: FontSize.sm },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderLight, borderRadius: Radius.md, padding: Spacing.lg },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs, lineHeight: sw(20) },
  modalPage: { flex: 1, backgroundColor: Colors.cream, paddingHorizontal: Spacing.xl },
  modalTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalKicker: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 2 },
  detailTitle: { fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '700', marginTop: Spacing.xl, marginBottom: Spacing.lg },
  detailInput: { flex: 1, borderTopWidth: 1, borderColor: Colors.borderLight, paddingTop: Spacing.lg, color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: sw(24) },
  detailItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  detailDot: { width: sw(18), height: sw(18), borderRadius: sw(9), borderWidth: 1, borderColor: Colors.inputBorder, marginRight: Spacing.md },
  detailItemText: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, lineHeight: sw(22) },
  modalKeyboard: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  sheet: { backgroundColor: Colors.profileFormBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  sheetTitle: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700' },
  label: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { minHeight: sw(50), borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, backgroundColor: Colors.inputBg, paddingHorizontal: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md },
  textArea: { minHeight: sw(130), paddingTop: Spacing.md },
  segment: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, padding: sw(3), marginTop: Spacing.md },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: sw(9), borderRadius: Radius.sm },
  segmentActive: { backgroundColor: Colors.brownDark },
  segmentText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  segmentTextActive: { color: Colors.textLight },
  saveButton: { marginTop: Spacing.xl, minHeight: sw(52), borderRadius: Radius.md, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: Colors.textLight, fontWeight: '700', fontSize: FontSize.md },
});
