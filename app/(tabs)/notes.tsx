// ============================================
// Jadwalin App — Notes Screen (BEIGE EDITION)
// Bug 8: Fixed keyboard covering note input
// ============================================

import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, FadeIn, 
  Layout, FadeOut, 
  FadeInUp,
  FadeInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useNotes } from '@/hooks/useNotes';
import { NoteList, NoteItem } from '@/types/task.types';
import { useAppTheme, Spacing, FontSize, Radius, Shadow, sw, sh } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

// ─── Note Detail View (Modal - Brown card) ───
function NoteDetailModal({
  visible, note, onClose, onAddItem, onToggleItem, onDeleteItem, onUpdateContent,
}: {
  visible: boolean; note: NoteList | null; onClose: () => void;
  onAddItem: (text: string) => void; onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void; onUpdateContent: (content: string) => void;
}) {
  const { Colors } = useAppTheme();
  const detailStyles = React.useMemo(() => getDetailStyles(Colors), [Colors]);
  const [newItemText, setNewItemText] = useState('');
  const [localContent, setLocalContent] = useState('');
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    if (note?.type === 'text') setLocalContent(note.content || '');
  }, [note]);

  if (!note) return null;

  const handleClose = () => {
    if (note?.type === 'text' && localContent !== note.content) {
      onUpdateContent(localContent);
    }
    onClose();
  };

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddItem(newItemText.trim());
    setNewItemText('');
    inputRef.current?.focus();
  };

  const handleToggle = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleItem(itemId);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={detailStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={detailStyles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[detailStyles.container, { paddingTop: insets.top + sw(10) }]}>
            {/* Back Button */}
            <InteractivePressable style={detailStyles.backBtn} onPress={handleClose}>
              <Ionicons name="arrow-back" size={sw(24)} color={Colors.textPrimary} />
            </InteractivePressable>

            {/* Note Detail Card (Brown) */}
            <Animated.View 
              entering={FadeInUp.duration(400).springify()}
              style={detailStyles.card}
            >
              <View style={detailStyles.cardHeader}>
                <Text style={detailStyles.cardTitle} numberOfLines={2}>{note.title}</Text>
              </View>

              {/* Note Content (List or Text) */}
              {note.type === 'text' ? (
                <View style={detailStyles.textContentWrapper}>
                  <TextInput
                    style={detailStyles.textAreaLarge}
                    multiline
                    textAlignVertical="top"
                    placeholder="Mulai menulis..."
                    placeholderTextColor={Colors.textMuted}
                    value={localContent}
                    onChangeText={setLocalContent}
                    onBlur={() => onUpdateContent(localContent)}
                  />
                </View>
              ) : (
                <>
                  <ScrollView
                    ref={scrollRef}
                    style={detailStyles.itemsScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                  >
                    {note.items.map((item, index) => (
                      <Animated.View 
                        key={item.id} 
                        entering={FadeInRight.delay(index * 50)}
                        layout={Layout.springify()}
                      >
                        <InteractivePressable
                          style={detailStyles.itemRow}
                          onPress={() => handleToggle(item.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          onLongPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert('Hapus Item', `Hapus "${item.text}"?`, [
                              { text: 'Batal', style: 'cancel' },
                              { text: 'Hapus', style: 'destructive', onPress: () => onDeleteItem(item.id) },
                            ]);
                          }}
                        >
                          <View style={[detailStyles.itemDot, item.completed && detailStyles.itemDotCompleted]} />
                          <Text style={[detailStyles.itemText, item.completed && detailStyles.itemTextCompleted]}>
                            {item.text}
                          </Text>
                        </InteractivePressable>
                      </Animated.View>
                    ))}
                  </ScrollView>

                  {/* Input pinned at bottom */}
                  <View style={[detailStyles.inputRow, { paddingBottom: insets.bottom || sw(10) }]}>
                    <TextInput
                      ref={inputRef}
                      style={detailStyles.input}
                      placeholder="Tambah item baru..."
                      placeholderTextColor={Colors.textMuted}
                      value={newItemText}
                      onChangeText={setNewItemText}
                      onSubmitEditing={handleAdd}
                      returnKeyType="done"
                    />
                    <InteractivePressable onPress={handleAdd} hapticType={Haptics.ImpactFeedbackStyle.Medium}>
                      <Ionicons name="add-circle" size={sw(32)} color={Colors.textPrimary} />
                    </InteractivePressable>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const getDetailStyles = (Colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.cream },
  keyboardView: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.cream },
  backBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  card: {
    flex: 1, backgroundColor: Colors.dailyCardBg, marginHorizontal: Spacing.md,
    borderRadius: Radius.xl, padding: Spacing.lg, marginTop: Spacing.sm,
    ...Shadow.lg,
  },
  cardHeader: { marginBottom: Spacing.md },
  cardTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary },
  itemsScroll: { flex: 1 },
  itemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: sw(12), 
    paddingHorizontal: sw(4),
    gap: Spacing.sm 
  },
  itemDot: { width: sw(14), height: sw(14), borderRadius: sw(7), backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.brownDark },
  itemDotCompleted: { backgroundColor: Colors.checkGreen, borderColor: Colors.checkGreen },
  itemText: { fontSize: FontSize.md, color: Colors.textPrimary, flex: 1, fontWeight: '500' },
  itemTextCompleted: { textDecorationLine: 'line-through', color: Colors.textMuted, opacity: 0.6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  input: {
    paddingHorizontal: Spacing.md, paddingVertical: sw(10), fontSize: FontSize.md, color: Colors.textPrimary,
  },
  textContentWrapper: { flex: 1, marginTop: Spacing.md },
  textAreaLarge: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: sw(24) },
});

// ─── Create Note Sheet ───
function CreateNoteSheet({
  visible, onClose, onSave,
}: {
  visible: boolean; onClose: () => void;
  onSave: (title: string, type: 'list' | 'text', items: string[], content: string) => void;
}) {
  const { Colors } = useAppTheme();
  const sheetStyles = React.useMemo(() => getSheetStyles(Colors), [Colors]);
  const [title, setTitle] = useState('');
  const [noteType, setNoteType] = useState<'list'|'text'>('list');
  const [items, setItems] = useState<string[]>(['']);
  const [content, setContent] = useState('');
  const insets = useSafeAreaInsets();

  const addItem = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setItems([...items, '']);
  };
  const updateItem = (index: number, text: string) => {
    const updated = [...items]; updated[index] = text; setItems(updated);
  };
  const removeItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!title.trim()) { Alert.alert('Error', 'Judul note wajib diisi'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const validItems = items.filter((i) => i.trim().length > 0);
    onSave(title.trim(), noteType, validItems, content.trim());
    setTitle(''); setItems(['']); setContent(''); setNoteType('list');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={sheetStyles.overlay}>
          <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            style={[sheetStyles.container, { paddingBottom: insets.bottom || Spacing.xl }]}
          >
            <View style={sheetStyles.header}>
              <InteractivePressable onPress={onClose}>
                <Ionicons name="close" size={sw(24)} color={Colors.textPrimary} />
              </InteractivePressable>
              <Text style={sheetStyles.headerTitle}>Note Baru</Text>
              <InteractivePressable onPress={handleSave}>
                <Text style={sheetStyles.saveText}>Simpan</Text>
              </InteractivePressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={sheetStyles.label}>Judul Note</Text>
              <TextInput style={sheetStyles.input} placeholder="Contoh: List belanja"
                placeholderTextColor={Colors.textMuted} value={title} onChangeText={setTitle} />

              <View style={sheetStyles.typeToggleRow}>
                <InteractivePressable 
                  style={[sheetStyles.typeToggleBtn, noteType === 'list' && sheetStyles.typeToggleActive]} 
                  onPress={() => setNoteType('list')}
                >
                  <Text style={[sheetStyles.typeToggleText, noteType === 'list' && sheetStyles.typeToggleTextActive]}>Checklist</Text>
                </InteractivePressable>
                <InteractivePressable 
                  style={[sheetStyles.typeToggleBtn, noteType === 'text' && sheetStyles.typeToggleActive]} 
                  onPress={() => setNoteType('text')}
                >
                  <Text style={[sheetStyles.typeToggleText, noteType === 'text' && sheetStyles.typeToggleTextActive]}>Bebas</Text>
                </InteractivePressable>
              </View>

              {noteType === 'list' ? (
                <>
                  <Text style={sheetStyles.label}>Item</Text>
                  {items.map((item, idx) => (
                    <Animated.View 
                      key={idx} 
                      entering={FadeInRight.delay(idx * 50)} 
                      layout={Layout.springify()} 
                      style={sheetStyles.itemRow}
                    >
                      <View style={sheetStyles.itemDot} />
                      <TextInput style={sheetStyles.itemInput} placeholder={`Item ${idx + 1}`}
                        placeholderTextColor={Colors.textMuted} value={item}
                        onChangeText={(text) => updateItem(idx, text)} />
                      {items.length > 1 && (
                        <InteractivePressable onPress={() => removeItem(idx)}>
                          <Ionicons name="close-circle" size={sw(20)} color={Colors.textMuted} />
                        </InteractivePressable>
                      )}
                    </Animated.View>
                  ))}

                  <InteractivePressable style={sheetStyles.addItemBtn} onPress={addItem}>
                    <Ionicons name="add" size={sw(18)} color={Colors.brown} />
                    <Text style={sheetStyles.addItemText}>Tambah Item</Text>
                  </InteractivePressable>
                </>
              ) : (
                <View>
                  <Text style={sheetStyles.label}>Isi Catatan</Text>
                  <TextInput style={[sheetStyles.input, sheetStyles.textArea]} placeholder="Mulai menulis cerita/catatan..."
                    placeholderTextColor={Colors.textMuted} value={content} onChangeText={setContent}
                    multiline numberOfLines={5} textAlignVertical="top" />
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const getSheetStyles = (Colors: any) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  container: {
    backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, maxHeight: '85%',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  saveText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.brown },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  itemDot: { width: sw(8), height: sw(8), borderRadius: sw(4), backgroundColor: Colors.brown },
  itemInput: {
    flex: 1, backgroundColor: Colors.inputBg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md, paddingVertical: sw(10), fontSize: FontSize.sm, color: Colors.textPrimary,
  },
  addItemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed',
    borderColor: Colors.inputBorder, justifyContent: 'center', marginTop: Spacing.sm, marginBottom: Spacing.lg,
  },
  addItemText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.brown },
  textArea: { minHeight: sw(120) },
  typeToggleRow: { flexDirection: 'row', backgroundColor: Colors.inputBg, borderRadius: Radius.md, padding: sw(4), marginTop: Spacing.md, borderWidth: 1, borderColor: Colors.inputBorder },
  typeToggleBtn: { flex: 1, paddingVertical: sw(8), alignItems: 'center', borderRadius: Radius.sm },
  typeToggleActive: { backgroundColor: Colors.white, ...Shadow.sm },
  typeToggleText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  typeToggleTextActive: { color: Colors.brown, fontWeight: '700' },
});

// ─── Main Notes Screen ───
export default function NotesScreen() {
  const { Colors } = useAppTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const { notes, notesLoading, addNote, editNote, removeNote, toggleNoteItem } = useNotes();
  const insets = useSafeAreaInsets();
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteList | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);

  const handleCreateNote = async (title: string, type: 'list' | 'text', items: string[], content: string) => {
    try {
      await addNote({
        title, emoji: '📝', color: Colors.pastelGreen,
        type, content,
        items: type === 'list' ? items.map((text, idx) => ({ text, completed: false, order: idx })) : [],
      });
      setShowCreateSheet(false);
    } catch (error: any) { Alert.alert('Error', error.message || 'Gagal membuat note'); }
  };

  const handleUpdateContent = async (newContent: string) => {
    if (!selectedNote) return;
    try {
      await editNote(selectedNote.id, { content: newContent });
      // update local immediately
      setSelectedNote(prev => prev ? { ...prev, content: newContent } : null);
    } catch (error: any) { Alert.alert('Error', error.message); }
  };

  const handleOpenDetail = (note: NoteList) => { 
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNote(note); 
    setShowDetail(true); 
  };

  const handleDeleteNote = async (noteId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Hapus Note', 'Yakin ingin menghapus note ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try { await removeNote(noteId); } catch (error: any) { Alert.alert('Error', error.message); }
      }},
    ]);
  };

  const handleAddItemToNote = async (text: string) => {
    if (!selectedNote) return;
    const newItem = { id: Date.now().toString(), text, completed: false, order: selectedNote.items.length };
    
    // Update locally for immediate feedback
    setSelectedNote(prev => prev ? ({
      ...prev,
      items: [...prev.items, newItem]
    }) : null);

    try {
      await editNote(selectedNote.id, {
        items: [...selectedNote.items, newItem]
      });
    } catch (error: any) { 
      Alert.alert('Error', error.message || 'Gagal menambah item'); 
      // Refresh to sync if error occurs
      const synced = notes.find(n => n.id === selectedNote.id);
      if (synced) setSelectedNote(synced);
    }
  };

  const handleToggleItemInDetail = async (itemId: string) => {
    if (!selectedNote) return;
    
    // Update locally for immediate feedback
    setSelectedNote(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      };
    });

    try {
      await toggleNoteItem(selectedNote.id, itemId);
    } catch (error: any) { 
      Alert.alert('Error', error.message);
      // Refresh to sync if error occurs
      const synced = notes.find(n => n.id === selectedNote.id);
      if (synced) setSelectedNote(synced);
    }
  };

  const handleDeleteItemInDetail = async (itemId: string) => {
    if (!selectedNote) return;
    
    // Update locally for immediate feedback
    setSelectedNote(prev => prev ? ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }) : null);

    try {
      await editNote(selectedNote.id, {
        items: selectedNote.items.filter(item => item.id !== itemId)
      });
    } catch (error: any) { 
      Alert.alert('Error', error.message);
      // Refresh to sync if error occurs
      const synced = notes.find(n => n.id === selectedNote.id);
      if (synced) setSelectedNote(synced);
    }
  };

  const toggleSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedNoteIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedNoteIds.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Hapus Note', `Hapus ${selectedNoteIds.length} note terpilih?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          for (const id of selectedNoteIds) {
            await removeNote(id);
          }
          setIsSelectionMode(false);
          setSelectedNoteIds([]);
        } catch (error: any) { Alert.alert('Error', error.message); }
      }},
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>

      <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.writeSection}>
        <View style={styles.writeSectionHeader}>
          <Text style={styles.writeSectionTitle}>Tulis Note Baru</Text>
          <InteractivePressable onPress={() => setShowCreateSheet(true)} hapticType={Haptics.ImpactFeedbackStyle.Medium}>
            <Ionicons name="add-circle" size={sw(32)} color={Colors.textPrimary} />
          </InteractivePressable>
        </View>
        <Text style={styles.writeSectionHint}>Klik tombol + untuk membuat note baru</Text>
      </Animated.View>

      <ScrollView style={styles.noteList} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: sw(120) }}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.noteListTitle}>Daftar Note</Text>
          {notes.length > 0 && (
            <InteractivePressable 
              onPress={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedNoteIds([]);
              }}
            >
              <Text style={styles.editBtnText}>{isSelectionMode ? 'Batal' : 'Pilih'}</Text>
            </InteractivePressable>
          )}
        </View>
        {notes.length === 0 ? (
          <Animated.View entering={FadeIn.duration(500)} style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={sw(48)} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada note</Text>
          </Animated.View>
        ) : (
          <View>
            {notes.map((note, index) => (
              <Animated.View 
                key={note.id} 
                entering={FadeInDown.delay(index * 80).duration(400).springify()}
                layout={Layout.springify()}
              >
                <InteractivePressable 
                  style={[styles.noteItem, isSelectionMode && selectedNoteIds.includes(note.id) && styles.noteItemSelected]} 
                  onPress={() => isSelectionMode ? toggleSelection(note.id) : handleOpenDetail(note)}
                  onLongPress={() => {
                    if (!isSelectionMode) {
                      setIsSelectionMode(true);
                      setSelectedNoteIds([note.id]);
                    }
                  }}
                >
                  {isSelectionMode && (
                    <Ionicons 
                      name={selectedNoteIds.includes(note.id) ? "checkbox" : "square-outline"} 
                      size={sw(24)} 
                      color={selectedNoteIds.includes(note.id) ? Colors.brown : Colors.textMuted} 
                      style={{ marginRight: Spacing.sm }}
                    />
                  )}
                  <View style={styles.noteItemDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteItemTitle} numberOfLines={1}>{note.title}</Text>
                    {note.type === 'text' && note.content ? (
                      <Text style={styles.noteItemSnippet} numberOfLines={1}>{note.content}</Text>
                    ) : note.items && note.items.length > 0 ? (
                      <Text style={styles.noteItemSnippet}>{note.items.length} item</Text>
                    ) : null}
                  </View>
                  {!isSelectionMode && <Ionicons name="chevron-forward" size={sw(20)} color={Colors.textSecondary} />}
                </InteractivePressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {isSelectionMode && (
        <Animated.View entering={FadeInUp} style={[styles.selectionBar, { bottom: (insets.bottom || 0) + sw(100) }]}>
          <InteractivePressable onPress={() => {
            if (selectedNoteIds.length === notes.length) setSelectedNoteIds([]);
            else setSelectedNoteIds(notes.map(n => n.id));
          }}>
            <Text style={styles.selectionBarBtn}>
              {selectedNoteIds.length === notes.length ? 'Batal Semua' : 'Pilih Semua'}
            </Text>
          </InteractivePressable>
          <Text style={styles.selectionBarCount}>{selectedNoteIds.length} Terpilih</Text>
          <InteractivePressable onPress={handleBulkDelete} disabled={selectedNoteIds.length === 0}>
            <Text style={[styles.selectionBarBtn, { color: selectedNoteIds.length > 0 ? 'red' : Colors.textMuted }]}>Hapus</Text>
          </InteractivePressable>
        </Animated.View>
      )}

      <CreateNoteSheet visible={showCreateSheet} onClose={() => setShowCreateSheet(false)} onSave={handleCreateNote} />
      <NoteDetailModal visible={showDetail} note={selectedNote}
        onClose={() => { setShowDetail(false); setSelectedNote(null); }}
        onAddItem={handleAddItemToNote} onToggleItem={handleToggleItemInDetail} onDeleteItem={handleDeleteItemInDetail}
        onUpdateContent={handleUpdateContent} />
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  backBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  writeSection: { backgroundColor: Colors.dailyCardBg, marginHorizontal: Spacing.md, borderRadius: Radius.xxl, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadow.md },
  writeSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  writeSectionTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  writeSectionHint: { fontSize: FontSize.sm, color: Colors.textSecondary },
  noteList: { flex: 1, paddingHorizontal: Spacing.md },
  noteListTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, paddingHorizontal: sw(4) },
  noteItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.pastelGreen, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: sw(16), marginBottom: Spacing.sm, ...Shadow.sm },
  noteItemDot: { width: sw(8), height: sw(8), borderRadius: sw(4), backgroundColor: Colors.textMuted, marginRight: Spacing.sm },
  noteItemTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  noteItemSnippet: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: sw(2) },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingHorizontal: sw(4) },
  editBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.brown },
  noteItemSelected: { borderColor: Colors.brown, borderWidth: 1, backgroundColor: Colors.white },
  selectionBar: {
    position: 'absolute', left: Spacing.md, right: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    ...Shadow.lg,
  },
  selectionBarBtn: { fontSize: FontSize.md, fontWeight: '700', color: Colors.brown },
  selectionBarCount: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
});

// Force fast refresh 1