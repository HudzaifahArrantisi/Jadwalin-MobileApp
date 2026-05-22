import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Platform, StyleSheet } from 'react-native';
import { useAppTheme, Spacing, FontSize, Radius, Shadow, sw } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasks } from '../../hooks/useTasks';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { parseTaskDate } from '../../utils/date';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate,
  FadeIn
} from 'react-native-reanimated';

// ─── Today Pulse Indicator ───
function TodayIndicator() {
  const { Colors } = useAppTheme();
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.1]),
  }));

  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          width: sw(36),
          height: sw(36),
          borderRadius: sw(18),
          backgroundColor: Colors.brownDark,
          zIndex: -1,
        },
        animatedStyle
      ]} 
    />
  );
}

// Configure Calendar Locale
LocaleConfig.locales['id'] = {
  monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';

const AVAILABLE_ICONS = [
  'calendar', 'briefcase', 'videocam', 'call', 'book',
  'restaurant', 'cafe', 'car', 'airplane', 'desktop',
  'fitness', 'musical-notes', 'cart', 'heart', 'star',
  'school', 'barbell', 'alarm', 'brush', 'build'
];

export default function CalendarScreen() {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { tasks, isLoading, addTask } = useTasks();
  const params = useLocalSearchParams();

  // Open add task form if directed from the floating '+' tab button
  React.useEffect(() => {
    if (params.add === 'true') {
      setShowAddTask(true);
      // Clear the query parameter so it doesn't trigger again on subsequent renders
      router.setParams({ add: undefined });
    }
  }, [params.add]);

  // Form state for new task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [timeType, setTimeType] = useState<'target' | 'schedule'>('schedule');
  const [targetTime, setTargetTime] = useState('19.00');
  const [waktuMulai, setWaktuMulai] = useState('19.00');
  const [waktuSelesai, setWaktuSelesai] = useState('21.00');
  const [selectedIcon, setSelectedIcon] = useState('calendar');
  
  const [showTargetTimePicker, setShowTargetTimePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [targetTimeDate, setTargetTimeDate] = useState(new Date());
  const [waktuMulaiDate, setWaktuMulaiDate] = useState(new Date());
  const [waktuSelesaiDate, setWaktuSelesaiDate] = useState(new Date());

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const canSaveTask = taskTitle.trim().length > 0;

  // Calculate marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: any = {};
    const todayDate = new Date();
    todayDate.setHours(0,0,0,0);
    
    // Mark tasks
    tasks.forEach(task => {
      const d = parseTaskDate(task.date);
      if (d) {
        const dateStr = format(d, 'yyyy-MM-dd');
        if (!marks[dateStr]) {
          marks[dateStr] = { marked: true, icons: [], isPast: false };
        }
        if (marks[dateStr].icons.length < 3) {
          marks[dateStr].icons.push(task.icon || 'calendar');
        }
      }
    });

    // Mark selected date
    if (!marks[selectedDateString]) {
      marks[selectedDateString] = { icons: [], isPast: false };
    }
    marks[selectedDateString].selected = true;

    // Mark past days with purple progress bullet
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentYear, currentMonth, i);
      d.setHours(0,0,0,0);
      const dateStr = format(d, 'yyyy-MM-dd');
      if (d < todayDate) {
        if (!marks[dateStr]) marks[dateStr] = { icons: [] };
        marks[dateStr].isPast = true;
      }
    }

    return marks;
  }, [tasks, selectedDateString, selectedDate]);

const handleAddTask = async () => {
  if (!taskTitle.trim()) return;
  
  await addTask({
    title: taskTitle,
    description: taskDesc,
    date: selectedDate,
    deadlineTime: timeType === 'target' ? targetTime : undefined,
    scheduledStart: timeType === 'schedule' ? waktuMulai : undefined,
    scheduledEnd: timeType === 'schedule' ? waktuSelesai : undefined,
    icon: selectedIcon,
    category: 'schedule',
    showOnWidget: true,
    reminder: true,        
    reminderDays: [7, 3, 2, 1]  
  });
  
  setTaskTitle('');
  setTaskDesc('');
  setShowAddTask(false);
};
  const renderTimePicker = (value: Date, onChange: (d: Date) => void, onClose: () => void) => {
    if (Platform.OS === 'ios') {
      return (
        <Modal transparent visible animationType="fade">
          <View style={styles.pickerModal}>
            <View style={[styles.pickerContainer, { backgroundColor: Colors.beige }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.pickerBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Text style={[styles.pickerBtn, { color: Colors.brownDark }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode="time"
                display="spinner"
                textColor={Colors.brownDark}
                onChange={(e, d) => d && onChange(d)}
              />
            </View>
          </View>
        </Modal>
      );
    }
    return (
      <DateTimePicker
        value={value}
        mode="time"
        display="default"
        onChange={(e, d) => {
          onClose();
          if (d) onChange(d);
        }}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          <Calendar
            key={isDark ? 'dark' : 'light'}
            current={selectedDateString}
            onDayPress={(day: any) => {
              setSelectedDate(new Date(day.timestamp));
            }}
            markedDates={markedDates}
            dayComponent={({ date, state }: any) => {
              const mark = markedDates[date.dateString as keyof typeof markedDates] as any;
              const isSelected = mark?.selected;
              const icons = mark?.icons || [];
              const isPast = mark?.isPast;
              const isToday = date.dateString === format(new Date(), 'yyyy-MM-dd');

              return (
                <View style={{ flex: 1, alignItems: 'center' }}>
                  {/* Connecting Line */}
                  {isPast && (
                    <Animated.View 
                      entering={FadeIn.delay(200).duration(500)}
                      style={{
                        position: 'absolute',
                        top: sw(15), // center of the circle
                        left: '50%',
                        width: '100%', // stretches to the next day
                        height: 3,
                        backgroundColor: Colors.brownDark,
                        zIndex: 0,
                      }} 
                    />
                  )}
                  <TouchableOpacity 
                    onPress={() => setSelectedDate(new Date(date.timestamp))}
                    style={[styles.dayContainer, { zIndex: 1 }]}
                  >
                    {isToday && !isSelected && <TodayIndicator />}
                    <View style={[
                      styles.dateCircle,
                      isPast && !isSelected && styles.dateCirclePast,
                      isSelected && styles.dateCircleSelected
                    ]}>
                      <Text style={[
                        styles.dayText,
                        state === 'disabled' && styles.dayTextDisabled,
                        isPast && !isSelected && { color: Colors.white, fontWeight: '600' },
                        isToday && !isSelected && { color: Colors.white, fontWeight: '700' },
                        isSelected && styles.dayTextSelected
                      ]}>
                        {date.day}
                      </Text>
                    </View>
                    
                    {icons.length > 0 ? (
                      <View style={styles.dayIconsRow}>
                        {icons.map((iconName: string, idx: number) => (
                          <Ionicons 
                            key={idx} 
                            name={iconName as any} 
                            size={10} 
                            color={Colors.brownDark} 
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={styles.dayIconsPlaceholder} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
            theme={{
              backgroundColor: Colors.beige,
              calendarBackground: Colors.beige,
              textSectionTitleColor: Colors.textSecondary,
              selectedDayBackgroundColor: Colors.brownDark,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.brownDark,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textMuted,
              arrowColor: Colors.brownDark,
              monthTextColor: Colors.textPrimary,
              textDayFontFamily: 'Poppins_400Regular',
              textMonthFontFamily: 'Poppins_700Bold',
              textDayHeaderFontFamily: 'Poppins_500Medium',
              textDayFontWeight: '400',
              textMonthFontWeight: '700',
              textDayHeaderFontWeight: '500',
              textDayFontSize: FontSize.sm,
              textMonthFontSize: FontSize.lg,
              textDayHeaderFontSize: FontSize.xxs,
            }}
            style={styles.calendar}
          />
        </View>

        <View style={styles.contentPadding}>
          {/* Selected Date Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formDateText}>{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}</Text>
            <TouchableOpacity onPress={() => setShowAddTask(!showAddTask)}>
              <Text style={styles.tambahText}>{showAddTask ? 'Batal' : '+ Tambah'}</Text>
            </TouchableOpacity>
          </View>

          {showAddTask && (
            <View style={styles.addTaskForm}>
              <View style={styles.addTaskHeader}>
                <View>
                  <Text style={styles.formTitle}>Tambah Jadwal</Text>
                  <Text style={styles.formSubtitle}>
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                  </Text>
                </View>
              </View>

              <View style={styles.nameIconRow}>
                <View style={styles.nameField}>
                  <Text style={styles.fieldLabel}>Nama jadwal</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      placeholder="Contoh: Belajar matematika"
                      placeholderTextColor={Colors.textMuted}
                      value={taskTitle}
                      onChangeText={setTaskTitle}
                    />
                  </View>
                </View>
                <View style={styles.iconField}>
                  <Text style={styles.fieldLabel}>Ikon</Text>
                  <TouchableOpacity style={styles.iconTrigger} onPress={() => setShowIconPicker(true)}>
                    <Ionicons name={selectedIcon as any} size={20} color={Colors.brownDark} />
                    <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>Catatan</Text>
              <View style={[styles.inputShell, styles.textAreaShell]}>
                <Ionicons name="document-text-outline" size={18} color={Colors.textMuted} style={styles.textAreaIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Opsional"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={taskDesc}
                  onChangeText={setTaskDesc}
                />
              </View>

              <View style={styles.timeSectionHeader}>
                <Text style={styles.fieldLabel}>Waktu</Text>
                <Text style={styles.fieldHint}>
                  {timeType === 'schedule' ? 'Mulai dan selesai' : 'Batas waktu'}
                </Text>
              </View>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, timeType === 'schedule' && styles.typeBtnActive]}
                  onPress={() => setTimeType('schedule')}
                >
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color={timeType === 'schedule' ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.typeBtnText, timeType === 'schedule' && styles.typeBtnTextActive]}>
                    Ada jam mulai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, timeType === 'target' && styles.typeBtnActive]}
                  onPress={() => setTimeType('target')}
                >
                  <Ionicons
                    name="flag-outline"
                    size={17}
                    color={timeType === 'target' ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.typeBtnText, timeType === 'target' && styles.typeBtnTextActive]}>
                    Deadline saja
                  </Text>
                </TouchableOpacity>
              </View>

              {timeType === 'schedule' ? (
                <View style={styles.timeRangeRow}>
                  <TouchableOpacity 
                    style={styles.datePickerBtn}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Text style={styles.timePickerLabel}>Mulai</Text>
                    <View style={styles.timeValueRow}>
                      <Ionicons name="time-outline" size={18} color={Colors.brownDark} />
                      <Text style={styles.datePickerText}>{waktuMulai}</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.datePickerBtn}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Text style={styles.timePickerLabel}>Selesai</Text>
                    <View style={styles.timeValueRow}>
                      <Ionicons name="time-outline" size={18} color={Colors.brownDark} />
                      <Text style={styles.datePickerText}>{waktuSelesai}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.timeRangeRow}>
                  <TouchableOpacity 
                    style={styles.datePickerBtn}
                    onPress={() => setShowTargetTimePicker(true)}
                  >
                    <Text style={styles.timePickerLabel}>Deadline</Text>
                    <View style={styles.timeValueRow}>
                      <Ionicons name="time-outline" size={18} color={Colors.brownDark} />
                      <Text style={styles.datePickerText}>{targetTime}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.saveBtn, !canSaveTask && styles.saveBtnDisabled]}
                onPress={handleAddTask}
                disabled={!canSaveTask}
              >
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.saveBtnText}>Simpan Jadwal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Timeline View */}
          <Text style={styles.sectionLabel}>Jadwal Hari Ini</Text>
          {isLoading ? (
            <Text style={styles.statusText}>Memuat jadwal...</Text>
          ) : (
            tasks
              .filter(t => {
                const d = parseTaskDate(t.date);
                if (!d) return false;
                return format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              })
              .sort((a, b) => (a.scheduledStart || '').localeCompare(b.scheduledStart || ''))
              .map((item, index) => (
                <View key={item.id || index} style={styles.taskItem}>
                  <View style={styles.taskTime}>
                    <Text style={styles.timeText}>{item.scheduledStart || item.deadlineTime || '--.--'}</Text>
                    {item.scheduledEnd ? <Text style={styles.timeTextEnd}>{item.scheduledEnd}</Text> : null}
                  </View>
                  <View style={styles.taskIndicator}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                  </View>
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeaderRow}>
                      <Ionicons name={(item.icon || 'calendar') as any} size={16} color={Colors.brownDark} />
                      <Text style={styles.taskTitle}>{item.title}</Text>
                    </View>
                    {item.description ? <Text style={styles.taskDesc}>{item.description}</Text> : null}
                  </View>
                </View>
              ))
          )}
          
          {!isLoading && tasks.filter(t => {
            const d = parseTaskDate(t.date);
            if (!d) return false;
            return format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          }).length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada jadwal untuk hari ini.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Pickers */}
      {showTargetTimePicker && renderTimePicker(targetTimeDate, (d) => {
        setTargetTimeDate(d);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        setTargetTime(`${h}.${m}`);
      }, () => setShowTargetTimePicker(false))}

      {showStartTimePicker && renderTimePicker(waktuMulaiDate, (d) => {
        setWaktuMulaiDate(d);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        setWaktuMulai(`${h}.${m}`);
      }, () => setShowStartTimePicker(false))}

      {showEndTimePicker && renderTimePicker(waktuSelesaiDate, (d) => {
        setWaktuSelesaiDate(d);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        setWaktuSelesai(`${h}.${m}`);
      }, () => setShowEndTimePicker(false))}

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.iconModalOverlay} activeOpacity={1} onPress={() => setShowIconPicker(false)}>
          <View style={styles.iconModalContainer}>
            <Text style={styles.iconModalTitle}>Pilih Ikon</Text>
            <ScrollView contentContainerStyle={styles.iconGrid}>
              {AVAILABLE_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  style={[styles.iconCell, selectedIcon === iconName && styles.iconCellSelected]}
                  onPress={() => {
                    setSelectedIcon(iconName);
                    setShowIconPicker(false);
                  }}
                >
                  <Ionicons 
                    name={iconName as any} 
                    size={24} 
                    color={selectedIcon === iconName ? Colors.white : Colors.brownDark} 
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.beige,
    ...Shadow.sm,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backBtn: { padding: Spacing.sm },
  calendarCard: {
    backgroundColor: Colors.beige,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  calendar: {
    paddingBottom: Spacing.sm,
  },
  contentPadding: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: sw(100),
  },
  formHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.lg 
  },
  formDateText: { 
    fontSize: FontSize.md, 
    fontWeight: '700', 
    color: Colors.textPrimary 
  },
  tambahText: { 
    fontSize: FontSize.md, 
    fontWeight: '600', 
    color: Colors.brownDark,
    backgroundColor: Colors.beigeDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  addTaskForm: {
    backgroundColor: Colors.beige,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  addTaskHeader: {
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  formSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  nameIconRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  nameField: { flex: 1 },
  iconField: { width: sw(82) },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  fieldHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  sectionLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  inputShell: {
    minHeight: sw(50),
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: sw(12),
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  textAreaShell: {
    minHeight: sw(84),
    alignItems: 'flex-start',
    paddingTop: sw(12),
    marginBottom: Spacing.md,
  },
  textArea: {
    minHeight: sw(62),
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  textAreaIcon: {
    marginTop: sw(2),
  },
  iconTrigger: {
    height: sw(50),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  datePickerBtn: {
    flex: 1,
    minHeight: sw(70),
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(10),
    justifyContent: 'center',
  },
  timePickerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  datePickerText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: {
    flex: 1,
    minHeight: sw(46),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sw(6),
    paddingHorizontal: Spacing.sm,
    paddingVertical: sw(10),
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  typeBtnActive: { backgroundColor: Colors.brownDark, borderColor: Colors.brownDark },
  typeBtnText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.white },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  saveBtn: {
    minHeight: sw(52),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.xl,
    marginTop: Spacing.lg,
    paddingVertical: sw(14),
    ...Shadow.sm,
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
  taskItem: { flexDirection: 'row', marginBottom: Spacing.md },
  taskTime: { width: sw(60), paddingTop: sw(4) },
  timeText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.brownDark },
  timeTextEnd: { fontSize: FontSize.xxs, fontWeight: '500', color: Colors.textSecondary, marginTop: 2 },
  taskIndicator: { alignItems: 'center', width: sw(30) },
  dot: { width: sw(10), height: sw(10), borderRadius: sw(5), backgroundColor: Colors.brownDark, zIndex: 1, marginTop: sw(8) },
  line: { width: 2, flex: 1, backgroundColor: Colors.beige, marginTop: -sw(2) },
  taskContent: { 
    flex: 1, 
    backgroundColor: Colors.beige, 
    padding: Spacing.md, 
    borderRadius: Radius.xl, 
    borderLeftWidth: 4,
    borderLeftColor: Colors.brownDark,
    ...Shadow.sm 
  },
  taskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  taskTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  taskDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: sw(4) },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl, opacity: 0.5 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md },
  statusText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  pickerModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  pickerContainer: { backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl, paddingBottom: sw(32) },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder },
  pickerBtn: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted },
  
  // Icon Picker Styles
  iconModalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
  iconModalContainer: { backgroundColor: Colors.beige, borderRadius: Radius.xl, width: '85%', maxHeight: '65%', padding: Spacing.lg, ...Shadow.lg },
  iconModalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.brownDark, marginBottom: Spacing.md, textAlign: 'center' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  iconCell: { width: sw(50), height: sw(50), borderRadius: Radius.lg, backgroundColor: Colors.inputBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.inputBorder },
  iconCellSelected: { backgroundColor: Colors.brownDark, borderColor: Colors.brownDark },

  // Custom Day Component Styles
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sw(38),
    paddingTop: sw(2),
  },
  dateCircle: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCirclePast: {
    backgroundColor: Colors.brownDark,
  },
  dateCircleSelected: {
    backgroundColor: Colors.brownDark,
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadow.glow,
  },
  dayText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  dayTextDisabled: {
    color: Colors.textMuted,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayIconsRow: {
    flexDirection: 'row',
    marginTop: sw(2),
    gap: sw(2),
    height: sw(12),
    alignItems: 'center',
  },
  dayIconsPlaceholder: {
    height: sw(12),
    marginTop: sw(2),
  },
});
