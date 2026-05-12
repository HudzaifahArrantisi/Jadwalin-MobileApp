import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Platform, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow, sw, FontWeight } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTasks } from '../../hooks/useTasks';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { parseTaskDate } from '../../utils/date';

// Configure Calendar Locale
LocaleConfig.locales['id'] = {
  monthNames: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  dayNames: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  dayNamesShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
  today: 'Hari ini'
};
LocaleConfig.defaultLocale = 'id';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  
  const { tasks, isLoading, addTask } = useTasks();

  // Form state for new task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [waktuMulai, setWaktuMulai] = useState('09.00');
  const [waktuSelesai, setWaktuSelesai] = useState('10.00');
  const [selectedIcon, setSelectedIcon] = useState('circle.fill');
  
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [waktuMulaiDate, setWaktuMulaiDate] = useState(new Date());
  const [waktuSelesaiDate, setWaktuSelesaiDate] = useState(new Date());

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  // Calculate marked dates for the calendar
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    // Mark tasks
    tasks.forEach(task => {
      const d = parseTaskDate(task.date);
      if (d) {
        const dateStr = format(d, 'yyyy-MM-dd');
        if (!marks[dateStr]) {
          marks[dateStr] = { marked: true, dotColor: Colors.brownDark };
        }
      }
    });

    // Mark selected date
    marks[selectedDateString] = {
      ...marks[selectedDateString],
      selected: true,
      selectedColor: Colors.brownDark,
      selectedTextColor: Colors.white,
    };

    return marks;
  }, [tasks, selectedDateString]);

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    
    await addTask({
      title: taskTitle,
      description: taskDesc,
      date: selectedDate,
      scheduledStart: waktuMulai,
      scheduledEnd: waktuSelesai,
      icon: selectedIcon,
      category: 'schedule',
      showOnWidget: true,
      reminder: false,
      reminderDays: []
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
            <View style={styles.pickerContainer}>
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={Colors.brownDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kalender</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          <Calendar
            current={selectedDateString}
            onDayPress={(day: any) => {
              setSelectedDate(new Date(day.timestamp));
            }}
            markedDates={markedDates}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.brown,
              selectedDayBackgroundColor: Colors.brownDark,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.brownDark,
              dayTextColor: Colors.textPrimary,
              textDisabledColor: Colors.textMuted,
              dotColor: Colors.brownDark,
              selectedDotColor: Colors.white,
              arrowColor: Colors.brownDark,
              monthTextColor: Colors.brownDark,
              indicatorColor: Colors.brownDark,
              textDayFontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter_400Regular',
              textMonthFontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter_700Bold',
              textDayHeaderFontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter_500Medium',
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
              <View style={styles.nameIconRow}>
                <View style={styles.nameField}>
                  <Text style={styles.fieldLabel}>NAMA JADWAL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Meeting Pagi"
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                  />
                </View>
                <View style={styles.iconField}>
                  <Text style={styles.fieldLabel}>IKON</Text>
                  <TouchableOpacity style={styles.iconTrigger}>
                    <IconSymbol name={selectedIcon as any} size={20} color={Colors.brownDark} />
                    <IconSymbol name="chevron.down" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>DESKRIPSI (OPSIONAL)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tambahkan detail..."
                multiline
                value={taskDesc}
                onChangeText={setTaskDesc}
              />

              <Text style={styles.fieldLabel}>WAKTU</Text>
              <View style={styles.timeRangeRow}>
                <TouchableOpacity 
                  style={[styles.datePickerBtn, { flex: 1 }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <IconSymbol name="clock" size={18} color={Colors.brownDark} />
                  <Text style={styles.datePickerText}>{waktuMulai}</Text>
                </TouchableOpacity>
                
                <Text style={styles.timeSeparator}>-</Text>
                
                <TouchableOpacity 
                  style={[styles.datePickerBtn, { flex: 1 }]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <IconSymbol name="clock" size={18} color={Colors.brownDark} />
                  <Text style={styles.datePickerText}>{waktuSelesai}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, { marginTop: Spacing.xl }]}
                onPress={handleAddTask}
              >
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
                      <IconSymbol name={(item.icon || 'calendar') as any} size={16} color={Colors.brownDark} />
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
              <IconSymbol name="calendar.badge.exclamationmark" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada jadwal untuk hari ini.</Text>
            </View>
          )}
        </View>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    ...Shadow.sm,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.brownDark,
  },
  backBtn: { padding: Spacing.sm },
  calendarCard: {
    backgroundColor: Colors.white,
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
    color: Colors.brownDark 
  },
  tambahText: { 
    fontSize: FontSize.md, 
    fontWeight: '600', 
    color: Colors.brownDark,
    backgroundColor: Colors.beige,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  addTaskForm: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.beige,
    ...Shadow.sm,
  },
  nameIconRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  nameField: { flex: 1 },
  iconField: { width: sw(90) },
  fieldLabel: { fontSize: FontSize.xxs, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md, letterSpacing: 1 },
  sectionLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.brownDark, marginBottom: Spacing.md },
  input: { backgroundColor: Colors.cream, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(12), fontSize: FontSize.md, color: Colors.textPrimary },
  textArea: { minHeight: sw(80), paddingTop: Spacing.md },
  iconTrigger: { flexDirection: 'row', alignItems: 'center', gap: sw(4), backgroundColor: Colors.cream, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(10) },
  datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.cream, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.inputBorder, paddingHorizontal: Spacing.md, paddingVertical: sw(14) },
  datePickerText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  timeRangeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  timeSeparator: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.brownDark, borderRadius: Radius.lg, paddingVertical: sw(14), alignItems: 'center', ...Shadow.sm },
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
    backgroundColor: Colors.white, 
    padding: Spacing.md, 
    borderRadius: Radius.lg, 
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
  pickerContainer: { backgroundColor: Colors.cream, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingBottom: sw(32) },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.inputBorder },
  pickerBtn: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textMuted },
});

