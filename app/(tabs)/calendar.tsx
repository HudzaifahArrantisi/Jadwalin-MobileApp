import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';
import { useAppTheme, Spacing, FontSize, Radius, sw, getTaskCardColor } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';
import TimePicker from '../../components/TimePicker';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const toKey = (date: Date) => format(date, 'yyyy-MM-dd');
const sameDate = (date: Date, taskDate: any) => {
  const parsed = parseTaskDate(taskDate);
  return parsed ? toKey(parsed) === toKey(date) : false;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  next.setDate(1);
  return next;
};

const buildMonthGrid = (monthDate: Date) => {
  const firstDay = startOfMonth(monthDate);
  const offset = firstDay.getDay();
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
};

function CalendarMonthGrid({
  monthDate,
  selectedDate,
  tasksByDate,
  onSelectDate,
}: {
  monthDate: Date;
  selectedDate: Date;
  tasksByDate: Record<string, Task[]>;
  onSelectDate: (date: Date) => void;
}) {
  const { Colors, isDark } = useAppTheme();
  const today = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let index = 0; index < monthDays.length; index += 7) {
      rows.push(monthDays.slice(index, index + 7));
    }
    return rows;
  }, [monthDays]);
  const selectedTextColor = isDark ? Colors.black : Colors.white;

  return (
    <View style={styles.monthGrid}>
      <View style={styles.weekdayRow}>
        {DAY_NAMES.map((day) => (
          <Text key={day} style={[styles.weekdayText, { color: Colors.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>
      {weeks.map((week, rowIndex) => (
        <View key={rowIndex} style={styles.weekRow}>
          {week.map((date) => {
            const key = toKey(date);
            const taskCount = tasksByDate[key]?.length || 0;
            const isSelected = sameDate(date, selectedDate);
            const isToday = sameDate(date, today);
            const isInMonth = date.getMonth() === monthDate.getMonth();
            const textColor = isSelected ? selectedTextColor : isInMonth ? Colors.textPrimary : Colors.textMuted;

            return (
              <InteractivePressable
                key={key}
                onPress={() => onSelectDate(date)}
                style={[
                  styles.monthCell,
                  isSelected && { backgroundColor: Colors.brownDark },
                  !isSelected && isToday && { borderColor: Colors.calendarSelected, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.monthCellText, { color: textColor }]}>{date.getDate()}</Text>
                {taskCount > 0 ? (
                  <View style={[styles.monthDot, { backgroundColor: isSelected ? selectedTextColor : Colors.calendarDot }]} />
                ) : (
                  <View style={styles.monthDotPlaceholder} />
                )}
              </InteractivePressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function TimelineTask({ task, index }: { task: Task; index: number }) {
  const { Colors } = useAppTheme();
  const accent = getTaskCardColor(task.title || index);
  const time = task.scheduledStart || task.deadlineTime || '--.--';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(320)} layout={Layout.springify()} style={styles.timelineRow}>
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, { color: Colors.textPrimary }]}>{time}</Text>
        {task.scheduledEnd ? <Text style={[styles.timeEnd, { color: Colors.textMuted }]}>{task.scheduledEnd}</Text> : null}
      </View>
      <View style={styles.lineColumn}>
        <View style={[styles.timelineDot, { backgroundColor: accent }]} />
        <View style={[styles.timelineLine, { borderColor: Colors.borderLight }]} />
      </View>
      <View style={[styles.timelineCard, { backgroundColor: Colors.dailyCardBg, borderColor: Colors.dailyCardBorder }]}>
        <Text style={[styles.timelineTitle, { color: Colors.textPrimary }]}>{task.title}</Text>
        {task.description ? <Text style={[styles.timelineDesc, { color: Colors.textSecondary }]}>{task.description}</Text> : null}
      </View>
    </Animated.View>
  );
}

export default function CalendarScreen() {
  const { Colors, isDark } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { tasks, isLoading, addTask } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskDate, setAddTaskDate] = useState(new Date());
  const [addTaskMonth, setAddTaskMonth] = useState(startOfMonth(new Date()));
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [timeMode, setTimeMode] = useState<'scheduled' | 'target'>('scheduled');
  const [startTime, setStartTime] = useState('09.00');
  const [endTime, setEndTime] = useState('10.00');
  const [targetTime, setTargetTime] = useState('17.00');

  React.useEffect(() => {
    if (params.add === 'true') {
      setShowAddTask(true);
      router.setParams({ add: undefined });
    }
  }, [params.add]);

  React.useEffect(() => {
    if (showAddTask) {
      setAddTaskDate(selectedDate);
      setAddTaskMonth(startOfMonth(selectedDate));
    }
  }, [showAddTask, selectedDate]);

  React.useEffect(() => {
    const monthStart = startOfMonth(addTaskDate);
    if (monthStart.getMonth() !== addTaskMonth.getMonth() || monthStart.getFullYear() !== addTaskMonth.getFullYear()) {
      setAddTaskMonth(monthStart);
    }
  }, [addTaskDate]);

  React.useEffect(() => {
    const monthStart = startOfMonth(selectedDate);
    if (monthStart.getMonth() !== visibleMonth.getMonth() || monthStart.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(monthStart);
    }
  }, [selectedDate]);

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      if (task.status === 'archived') return acc;
      const parsed = parseTaskDate(task.date);
      if (!parsed) return acc;
      const key = toKey(parsed);
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    return tasks
      .filter((task) => sameDate(selectedDate, task.date) && task.status !== 'archived')
      .sort((a, b) => (a.scheduledStart || a.deadlineTime || '').localeCompare(b.scheduledStart || b.deadlineTime || ''));
  }, [tasks, selectedDate]);

  const canSaveTask = taskTitle.trim().length > 0;

  const handleAddTask = async () => {
    if (!canSaveTask) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isScheduled = timeMode === 'scheduled';
    try {
      await addTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        date: addTaskDate,
        scheduledStart: isScheduled ? startTime.trim() || undefined : undefined,
        scheduledEnd: isScheduled ? endTime.trim() || undefined : undefined,
        deadlineTime: !isScheduled ? targetTime.trim() || undefined : undefined,
        icon: 'calendar-outline',
        category: 'schedule',
        showOnWidget: true,
        reminder: true,
        reminderDays: [7, 3, 2, 1],
      });
      setTaskTitle('');
      setTaskDesc('');
      setSelectedDate(addTaskDate);
      setShowAddTask(false);
    } catch (error: any) {
      console.error('[CalendarScreen] Gagal menyimpan jadwal:', error);
      Alert.alert('Gagal Menyimpan', error.message || 'Terjadi kesalahan saat menyimpan jadwal.');
    }
  };

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={screenStyles.content} keyboardShouldPersistTaps="handled">
        <View style={screenStyles.header}>
          <View>
            <Text style={screenStyles.kicker}>KALENDAR</Text>
            <Text style={screenStyles.title}>{format(selectedDate, 'EEEE, d MMMM', { locale: id })}</Text>
          </View>
          <InteractivePressable style={screenStyles.addButton} onPress={() => setShowAddTask(true)}>
            <Ionicons name="add" size={sw(20)} color={isDark ? Colors.black : Colors.white} />
          </InteractivePressable>
        </View>

        <Animated.View entering={FadeInDown.duration(360)} style={screenStyles.monthBlock}>
          <View style={screenStyles.monthHeader}>
            <InteractivePressable style={screenStyles.monthNav} onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}>
              <Ionicons name="chevron-back" size={sw(18)} color={Colors.textPrimary} />
            </InteractivePressable>
            <Text style={screenStyles.monthTitle}>{format(visibleMonth, 'MMMM yyyy', { locale: id })}</Text>
            <InteractivePressable style={screenStyles.monthNav} onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
              <Ionicons name="chevron-forward" size={sw(18)} color={Colors.textPrimary} />
            </InteractivePressable>
          </View>
          <CalendarMonthGrid
            monthDate={visibleMonth}
            selectedDate={selectedDate}
            tasksByDate={tasksByDate}
            onSelectDate={setSelectedDate}
          />
        </Animated.View>

        <View style={screenStyles.timelineHeader}>
          <Text style={screenStyles.sectionTitle}>List Kegiatan</Text>
          <Text style={screenStyles.sectionHint}>{selectedTasks.length} jadwal</Text>
        </View>

        {isLoading ? (
          <Text style={screenStyles.statusText}>Memuat jadwal...</Text>
        ) : selectedTasks.length > 0 ? (
          selectedTasks.map((task, index) => <TimelineTask key={task.id} task={task} index={index} />)
        ) : (
          <View style={screenStyles.emptyBox}>
            <Text style={screenStyles.emptyTitle}>Tanggal ini masih kosong.</Text>
            <Text style={screenStyles.emptyText}>Gunakan tombol tambah untuk menyusun agenda secara kronologis.</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAddTask} transparent animationType="fade" onRequestClose={() => setShowAddTask(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={screenStyles.modalKeyboard}>
          <Pressable style={screenStyles.modalOverlay} onPress={() => setShowAddTask(false)}>
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
              <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxHeight: '100%', flexDirection: 'column' }}>
                <View style={screenStyles.sheetHeader}>
                  <View>
                    <Text style={screenStyles.sheetTitle}>Tambah Jadwal</Text>
                    <Text style={screenStyles.sheetSubtitle}>{format(addTaskDate, 'EEEE, d MMMM yyyy', { locale: id })}</Text>
                  </View>
                  <InteractivePressable onPress={() => setShowAddTask(false)}>
                    <Ionicons name="close" size={sw(22)} color={Colors.textPrimary} />
                  </InteractivePressable>
                </View>

                <ScrollView 
                  keyboardShouldPersistTaps="handled" 
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false} 
                  style={{ flexShrink: 1 }}
                  contentContainerStyle={{ paddingBottom: Spacing.xl }}
                >
                  <View style={screenStyles.datePickerHeader}>
                    <Text style={screenStyles.label}>Tanggal</Text>
                    <Text style={screenStyles.datePreview}>{format(addTaskDate, 'd MMM yyyy', { locale: id })}</Text>
                  </View>
                  <View style={screenStyles.monthHeader}>
                    <InteractivePressable style={screenStyles.monthNav} onPress={() => setAddTaskMonth(addMonths(addTaskMonth, -1))}>
                      <Ionicons name="chevron-back" size={sw(18)} color={Colors.textPrimary} />
                    </InteractivePressable>
                    <Text style={screenStyles.monthTitle}>{format(addTaskMonth, 'MMMM yyyy', { locale: id })}</Text>
                    <InteractivePressable style={screenStyles.monthNav} onPress={() => setAddTaskMonth(addMonths(addTaskMonth, 1))}>
                      <Ionicons name="chevron-forward" size={sw(18)} color={Colors.textPrimary} />
                    </InteractivePressable>
                  </View>
                  <CalendarMonthGrid
                    monthDate={addTaskMonth}
                    selectedDate={addTaskDate}
                    tasksByDate={tasksByDate}
                    onSelectDate={setAddTaskDate}
                  />

                  <Text style={screenStyles.label}>Nama jadwal</Text>
                  <TextInput
                    style={screenStyles.input}
                    placeholder="Contoh: Review materi"
                    placeholderTextColor={Colors.textMuted}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                  />

                  <Text style={screenStyles.label}>Catatan</Text>
                  <TextInput
                    style={[screenStyles.input, screenStyles.textArea]}
                    placeholder="Opsional"
                    placeholderTextColor={Colors.textMuted}
                    value={taskDesc}
                    onChangeText={setTaskDesc}
                    multiline
                    textAlignVertical="top"
                  />

                  <View style={screenStyles.timeModeRow}>
                    <InteractivePressable
                      style={[screenStyles.timeModePill, timeMode === 'scheduled' && screenStyles.timeModePillActive]}
                      onPress={() => setTimeMode('scheduled')}
                    >
                      <Text style={[screenStyles.timeModeText, timeMode === 'scheduled' && screenStyles.timeModeTextActive]}>Waktu terjadwal</Text>
                    </InteractivePressable>
                    <InteractivePressable
                      style={[screenStyles.timeModePill, timeMode === 'target' && screenStyles.timeModePillActive]}
                      onPress={() => setTimeMode('target')}
                    >
                      <Text style={[screenStyles.timeModeText, timeMode === 'target' && screenStyles.timeModeTextActive]}>Waktu target</Text>
                    </InteractivePressable>
                  </View>

                  {timeMode === 'scheduled' ? (
                    <View style={screenStyles.timeRow}>
                      <View style={screenStyles.timeField}>
                        <TimePicker label="Mulai" value={startTime} onChange={setStartTime} />
                      </View>
                      <View style={screenStyles.timeField}>
                        <TimePicker label="Selesai" value={endTime} onChange={setEndTime} />
                      </View>
                    </View>
                  ) : (
                    <View style={screenStyles.timeField}>
                      <TimePicker label="Target" value={targetTime} onChange={setTargetTime} />
                    </View>
                  )}

                  <InteractivePressable style={[screenStyles.saveButton, !canSaveTask && screenStyles.disabledButton]} onPress={handleAddTask} disabled={!canSaveTask}>
                    <Text style={screenStyles.saveText}>Simpan Jadwal</Text>
                  </InteractivePressable>
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  monthGrid: { marginTop: Spacing.sm },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  weekdayText: { flex: 1, textAlign: 'center', fontSize: FontSize.xxs, letterSpacing: 1.1, textTransform: 'uppercase' },
  weekRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  monthCell: {
    flex: 1,
    minHeight: sw(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  monthCellText: { fontSize: FontSize.sm, fontWeight: '600' },
  monthDot: { width: sw(4), height: sw(4), borderRadius: sw(2), marginTop: sw(4) },
  monthDotPlaceholder: { width: sw(4), height: sw(4), marginTop: sw(4), opacity: 0 },
  timelineRow: { flexDirection: 'row', minHeight: sw(88), marginBottom: Spacing.md },
  timeColumn: { width: sw(62), paddingTop: sw(3) },
  timeText: { fontSize: FontSize.sm, fontWeight: '700' },
  timeEnd: { fontSize: FontSize.xxs, marginTop: sw(3) },
  lineColumn: { width: sw(26), alignItems: 'center' },
  timelineDot: { width: sw(10), height: sw(10), borderRadius: sw(5), marginTop: sw(8), zIndex: 2 },
  timelineLine: { flex: 1, borderLeftWidth: 1, borderStyle: 'dashed', marginTop: sw(3) },
  timelineCard: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  timelineTitle: { fontSize: FontSize.md, fontWeight: '700' },
  timelineDesc: { fontSize: FontSize.sm, lineHeight: sw(20), marginTop: Spacing.xs },
});

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: Spacing.xl, paddingBottom: sw(132) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  title: { fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '700' },
  addButton: { width: sw(38), height: sw(38), borderRadius: Radius.full, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  monthBlock: { marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.lg, padding: Spacing.md, backgroundColor: Colors.profileFormBg },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  monthNav: {
    width: sw(34),
    height: sw(34),
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inputBg,
  },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderLight, borderRadius: Radius.md, padding: Spacing.lg },
  emptyTitle: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: sw(20), marginTop: Spacing.xs },
  statusText: { color: Colors.textMuted, fontSize: FontSize.sm },
  modalKeyboard: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  sheet: { backgroundColor: Colors.profileFormBg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  sheetTitle: { fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: '700' },
  sheetSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  datePickerHeader: { marginBottom: Spacing.sm },
  datePreview: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { minHeight: sw(50), borderWidth: 1, borderColor: Colors.inputBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.md, color: Colors.textPrimary, backgroundColor: Colors.inputBg, fontSize: FontSize.md },
  textArea: { minHeight: sw(86), paddingTop: Spacing.md },
  timeModeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  timeModePill: { flex: 1, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.full, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.inputBg },
  timeModePillActive: { backgroundColor: Colors.brownDark, borderColor: Colors.brownDark },
  timeModeText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  timeModeTextActive: { color: Colors.textLight },
  timeRow: { flexDirection: 'row', gap: Spacing.md },
  timeField: { flex: 1 },
  saveButton: { marginTop: Spacing.xl, minHeight: sw(52), borderRadius: Radius.md, backgroundColor: Colors.brownDark, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.42 },
  saveText: { color: Colors.textLight, fontSize: FontSize.md, fontWeight: '700' },
});
