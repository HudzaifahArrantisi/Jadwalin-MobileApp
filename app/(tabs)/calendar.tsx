// ============================================
// Jadwalin App — Calendar + Add Schedule (BEIGE EDITION)
// Bug 2: Fixed picker rendering collisions
// Bug 3: Fixed Saturday overflow
// ============================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, KeyboardAvoidingView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTasks } from '@/hooks/useTasks';
import { Task, TASK_ICON_OPTIONS } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';
import { Colors, Spacing, FontSize, Radius, Shadow, sw, sh, SCREEN_WIDTH } from '@/constants/theme';

const formatLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ─── Month Calendar Component ───
// Bug 3: Use Mon-Sun layout to prevent Saturday overflow
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getCalendarDays(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert to Mon-based: Mon=0, Tue=1, ..., Sun=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: Date }> = [];

  // Previous month trailing days
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    days.push({ date: d, isCurrentMonth: false, fullDate: new Date(year, month - 1, d) });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, isCurrentMonth: true, fullDate: new Date(year, month, i) });
  }

  // Fill remaining to complete rows of 7
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: i, isCurrentMonth: false, fullDate: new Date(year, month + 1, i) });
    }
  }

  return days;
}

function MonthCalendar({
  selectedDate, onSelectDate, currentMonth, currentYear,
  onPrevMonth, onNextMonth, taskDates,
}: {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  taskDates: Record<string, { indicators: { isIcon: boolean, value: string }[] }>;
}) {
  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const todayStr = formatLocalDate(new Date());
  // Bug 3: Calculate cell width with proper padding
  const containerPadding = sw(16) * 2; // padding on both sides
  const calPadding = Spacing.md * 2;
  const cellWidth = Math.floor((SCREEN_WIDTH - containerPadding - calPadding) / 7);

  return (
    <View style={calStyles.container}>
      <View style={calStyles.monthHeader}>
        <TouchableOpacity onPress={onPrevMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={sw(22)} color={Colors.brownDark} />
        </TouchableOpacity>
        <Text style={calStyles.monthTitle}>
          {MONTHS_ID[currentMonth]} {currentYear}
        </Text>
        <TouchableOpacity onPress={onNextMonth} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={sw(22)} color={Colors.brownDark} />
        </TouchableOpacity>
      </View>

      <View style={calStyles.dayNamesRow}>
        {DAY_NAMES.map((name) => (
          <Text key={name} style={[calStyles.dayNameText, { width: cellWidth }]}>
            {name}
          </Text>
        ))}
      </View>

      <View style={calStyles.grid}>
        {calendarDays.map((day, idx) => {
          const dateStr = formatLocalDate(day.fullDate);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const taskInfo = taskDates[dateStr];

          return (
            <TouchableOpacity
              key={idx}
              style={[calStyles.dayCell, { width: cellWidth }, isSelected && calStyles.dayCellSelected]}
              onPress={() => { if (day.isCurrentMonth) onSelectDate(dateStr); }}
              activeOpacity={0.7}
            >
              <Text style={[
                calStyles.dayText,
                !day.isCurrentMonth && calStyles.dayTextOther,
                isSelected && calStyles.dayTextSelected,
                isToday && !isSelected && calStyles.dayTextToday,
              ]}>
                {day.date}
              </Text>
              {taskInfo && taskInfo.indicators.length > 0 && (
                <View style={calStyles.dayIndicators}>
                  {taskInfo.indicators.slice(0, 3).map((ind, i) => {
                    const dotColors = [Colors.calendarDot, Colors.brownDark, Colors.brown];
                    const defaultColor = dotColors[i % dotColors.length];
                    const color = isSelected ? Colors.white : defaultColor;

                    if (ind.isIcon) {
                      return <Ionicons key={i} name={ind.value as any} size={sw(10)} color={color} />;
                    } else {
                      return <View key={i} style={[calStyles.dotIndicator, { backgroundColor: color }]} />;
                    }
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.calendarHeader,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm, marginBottom: Spacing.md,
  },
  monthTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.brownDark },
  dayNamesRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  dayNameText: { textAlign: 'center', fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { alignItems: 'center', paddingVertical: sw(6), minHeight: sw(40) },
  dayCellSelected: { backgroundColor: Colors.calendarSelected, borderRadius: Radius.md },
  dayText: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  dayTextOther: { color: Colors.textMuted, opacity: 0.4 },
  dayTextSelected: { color: Colors.white, fontWeight: '700' },
  dayTextToday: { color: Colors.brownDark, fontWeight: '800' },
  dayIndicators: { flexDirection: 'row', gap: sw(2), marginTop: sw(2), height: sw(10), alignItems: 'center' },
  dotIndicator: { width: sw(5), height: sw(5), borderRadius: sw(3), backgroundColor: Colors.calendarDot },
});

// ─── Icon Picker as Modal (Bug 2: prevents collision) ───
function IconPickerModal({
  visible, onClose, selectedIcon, onSelect,
}: {
  visible: boolean; onClose: () => void;
  selectedIcon: string; onSelect: (icon: string) => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={iconModalStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={iconModalStyles.container}>
          <Text style={iconModalStyles.title}>Pilih Icon</Text>
          <View style={iconModalStyles.grid}>
            {TASK_ICON_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[iconModalStyles.item, selectedIcon === option.key && iconModalStyles.itemSelected]}
                onPress={() => { onSelect(option.key); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name={option.key as any} size={sw(24)} color={Colors.brownDark} />
                <Text style={iconModalStyles.label} numberOfLines={1}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const iconModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  container: {
    backgroundColor: Colors.cream, borderRadius: Radius.xl, padding: Spacing.lg,
    width: SCREEN_WIDTH - sw(48), ...Shadow.lg,
  },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.brownDark, marginBottom: Spacing.md, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  item: {
    alignItems: 'center', paddingVertical: sw(10), paddingHorizontal: sw(8),
    borderRadius: Radius.md, width: sw(72), gap: sw(4),
  },
  itemSelected: { backgroundColor: Colors.pastelGreen },
  label: { fontSize: FontSize.xxs, color: Colors.textSecondary, textAlign: 'center' },
});

// ─── Main Calendar Screen ───
export default function CalendarScreen() {
  const { tasks, addTask } = useTasks();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(today));

  // Form state
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [targetWaktu, setTargetWaktu] = useState('');
  const [targetWaktuDate, setTargetWaktuDate] = useState(new Date());
  const [showTargetTimePicker, setShowTargetTimePicker] = useState(false);
  const [waktuMulai, setWaktuMulai] = useState('');
  const [waktuMulaiDate, setWaktuMulaiDate] = useState(new Date());
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [waktuSelesaiDate, setWaktuSelesaiDate] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const taskDates = useMemo(() => {
    const map: Record<string, { indicators: { isIcon: boolean, value: string }[] }> = {};
    tasks.forEach((task) => {
      const d = parseTaskDate(task.date);
      if (!d) return;
      // Ensure we use the exact same format as formatLocalDate
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      
      if (!map[key]) map[key] = { indicators: [] };
      if (task.icon) {
        map[key].indicators.push({ isIcon: true, value: task.icon });
      } else {
        map[key].indicators.push({ isIcon: false, value: 'dot' });
      }
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Force set deadlineDate to match the selectedDate string
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const newDate = new Date(year, month, day, 12, 0, 0);
    setDeadlineDate(newDate);
  };

  const formattedSelectedDate = (() => {
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[d.getDay()]}, ${day} ${MONTHS_ID[month]} ${year}`;
  })();

  const formattedDeadline = (() => {
    const d = deadlineDate;
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const handleTambah = async () => {
    if (!namaKegiatan.trim()) {
      Alert.alert('Error', 'Nama kegiatan wajib diisi');
      return;
    }
    try {
      // Use deadlineDate as the source of truth for the database
      const taskDate = new Date(deadlineDate);
      taskDate.setHours(12, 0, 0, 0); // Keep noon for consistency
      
      await addTask({
        title: namaKegiatan,
        description: deskripsi,
        date: taskDate,
        category: 'schedule',
        showOnWidget: true,
        reminder: true,
        reminderDays: [7, 3, 2, 1, 0],
        icon: selectedIcon || undefined,
        deadlineTime: targetWaktu || undefined,
        scheduledStart: waktuMulai || undefined,
        scheduledEnd: waktuSelesai || undefined,
      });
      setNamaKegiatan(''); setSelectedIcon(''); setDeskripsi('');
      setTargetWaktu(''); setTargetWaktuDate(new Date());
      setWaktuMulai(''); setWaktuMulaiDate(new Date());
      setWaktuSelesai(''); setWaktuSelesaiDate(new Date());
      Alert.alert('Berhasil', 'Jadwal berhasil ditambahkan!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Gagal menambahkan jadwal');
    }
  };

  // Bug 2: Wrap pickers in Platform-aware rendering
  const renderDatePicker = (show: boolean, value: Date, mode: 'date' | 'time',
    onDone: (d: Date) => void, onHide: () => void) => {
    if (!show) return null;
    if (Platform.OS === 'ios') {
      return (
        <Modal visible transparent animationType="slide">
          <View style={styles.pickerModal}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={onHide}><Text style={styles.pickerBtn}>Batal</Text></TouchableOpacity>
                <TouchableOpacity onPress={onHide}><Text style={[styles.pickerBtn, { color: Colors.brownDark }]}>Selesai</Text></TouchableOpacity>
              </View>
              <DateTimePicker 
                value={value} 
                mode={mode} 
                display="spinner"
                themeVariant="light"
                textColor={Colors.brownDark}
                onChange={(_, d) => { if (d) onDone(d); }} 
              />
            </View>
          </View>
        </Modal>
      );
    }
    return (
      <DateTimePicker value={value} mode={mode} display="default"
        onChange={(_, d) => { onHide(); if (d) onDone(d); }} />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={sw(24)} color={Colors.textPrimary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: sw(120) }}
          keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <MonthCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate}
              currentMonth={currentMonth} currentYear={currentYear}
              onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} taskDates={taskDates} />
          </Animated.View>

          <View style={styles.formSection}>
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.formHeader}>
              <Text style={styles.formDateText}>{formattedSelectedDate}</Text>
              <TouchableOpacity onPress={handleTambah} activeOpacity={0.7}>
                <Text style={styles.tambahText}>Tambah +</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Nama Kegiatan + Icon */}
            <Animated.View entering={FadeInDown.delay(250).duration(400)}>
              <View style={styles.nameIconRow}>
                <View style={styles.nameField}>
                  <Text style={styles.fieldLabel}>Nama kegiatan *</Text>
                  <TextInput style={styles.input} placeholder="Masukkan nama kegiatan"
                    placeholderTextColor={Colors.textMuted} value={namaKegiatan} onChangeText={setNamaKegiatan} />
                </View>
                <View style={styles.iconField}>
                  <Text style={styles.fieldLabel}>Icon</Text>
                  <TouchableOpacity style={styles.iconTrigger} onPress={() => setShowIconPicker(true)} activeOpacity={0.7}>
                    <Ionicons name={(selectedIcon || 'help-circle-outline') as any} size={sw(22)} color={Colors.brownDark} />
                    <Ionicons name="chevron-down" size={sw(14)} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Deskripsi */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <Text style={styles.fieldLabel}>Deskripsi (opsional)</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Deskripsi tambahan"
                placeholderTextColor={Colors.textMuted} value={deskripsi} onChangeText={setDeskripsi}
                multiline numberOfLines={3} textAlignVertical="top" />
            </Animated.View>

            {/* Tanggal Deadline */}
            <Animated.View entering={FadeInDown.delay(350).duration(400)}>
              <Text style={styles.sectionLabel}>Deadline/Jadwal</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDeadlinePicker(true)} activeOpacity={0.7}>
                <Ionicons name="calendar" size={sw(18)} color={Colors.brownDark} />
                <Text style={styles.datePickerText}>{formattedDeadline}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Target Waktu */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)}>
              <Text style={styles.fieldLabel}>Target waktu</Text>
              <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowTargetTimePicker(true)} activeOpacity={0.7}>
                <Ionicons name="time" size={sw(18)} color={Colors.brownDark} />
                <Text style={styles.datePickerText}>{targetWaktu || 'Pilih waktu'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Waktu Terjadwal */}
            <Animated.View entering={FadeInDown.delay(450).duration(400)}>
              <Text style={styles.fieldLabel}>Waktu Terjadwal (Opsional)</Text>
              <View style={styles.timeRangeRow}>
                <TouchableOpacity style={[styles.datePickerBtn, { flex: 1 }]}
                  onPress={() => setShowStartTimePicker(true)} activeOpacity={0.7}>
                  <Ionicons name="time" size={sw(16)} color={Colors.brownDark} />
                  <Text style={styles.datePickerText}>{waktuMulai || 'Mulai'}</Text>
                </TouchableOpacity>
                <Text style={styles.timeSeparator}>-</Text>
                <TouchableOpacity style={[styles.datePickerBtn, { flex: 1 }]}
                  onPress={() => setShowEndTimePicker(true)} activeOpacity={0.7}>
                  <Text style={styles.datePickerText}>{waktuSelesai || 'Selesai'}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <Text style={styles.reminderInfo}>
                Notifikasi Reminder akan terkirim h-7, h-3, h-2, h-1, h0
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bug 2: All pickers rendered outside ScrollView to prevent collision */}
      <IconPickerModal visible={showIconPicker} onClose={() => setShowIconPicker(false)}
        selectedIcon={selectedIcon} onSelect={setSelectedIcon} />

      {renderDatePicker(showDeadlinePicker, deadlineDate, 'date',
        (d) => {
          setDeadlineDate(d);
          // Sync selectedDate so calendar selection follows the picker
          setSelectedDate(formatLocalDate(d));
        }, () => setShowDeadlinePicker(false))}

      {renderDatePicker(showTargetTimePicker, targetWaktuDate, 'time',
        (d) => {
          setTargetWaktuDate(d);
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          setTargetWaktu(`${h}.${m}`);
        }, () => setShowTargetTimePicker(false))}

      {renderDatePicker(showStartTimePicker, waktuMulaiDate, 'time',
        (d) => {
          setWaktuMulaiDate(d);
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          setWaktuMulai(`${h}.${m}`);
        }, () => setShowStartTimePicker(false))}

      {renderDatePicker(showEndTimePicker, waktuSelesaiDate, 'time',
        (d) => {
          setWaktuSelesaiDate(d);
          const h = d.getHours().toString().padStart(2, '0');
          const m = d.getMinutes().toString().padStart(2, '0');
          setWaktuSelesai(`${h}.${m}`);
        }, () => setShowEndTimePicker(false))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  backBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  formSection: { paddingHorizontal: Spacing.lg },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  formDateText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  tambahText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.brownDark },
  nameIconRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  nameField: { flex: 1 },
  iconField: { width: sw(90) },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sectionLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(12), fontSize: FontSize.md, color: Colors.textPrimary },
  textArea: { minHeight: sw(80), paddingTop: Spacing.md },
  iconTrigger: { flexDirection: 'row', alignItems: 'center', gap: sw(4), backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(10) },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(14) },
  datePickerText: { fontSize: FontSize.md, color: Colors.textPrimary },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeSeparator: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  reminderInfo: { fontSize: FontSize.xs, color: Colors.textMuted, fontStyle: 'italic', marginTop: Spacing.lg },
  // iOS picker modal styles
  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  pickerContainer: { backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: sw(32) },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder },
  pickerBtn: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted },
});
