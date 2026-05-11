// ============================================
// Jadwalin App — Home Screen (BEIGE EDITION)
// Bug 4: Firebase sync fixed in task.service.ts
// Bug 5: Scrollable week calendar with left/right scroll
// Bug 6: Daily section dropdown shows mini calendar
// Bug 7: Weekly list shows tasks within current week only
// ============================================

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';
import { Colors, Spacing, FontSize, Radius, Shadow, sw, sh, SCREEN_WIDTH } from '@/constants/theme';

const formatLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Generate multiple weeks for scrollable calendar ───
function generateWeeks(centerDate: Date, weeksBefore = 8, weeksAfter = 8) {
  const dayOfWeek = centerDate.getDay();
  const monday = new Date(centerDate);
  monday.setDate(centerDate.getDate() - ((dayOfWeek + 6) % 7));

  const weeks: Array<{ key: string; days: Array<{ key: string; dayName: string; date: number; month: number; year: number; fullDate: Date; dateStr: string }> }> = [];

  for (let w = -weeksBefore; w <= weeksAfter; w++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + w * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push({
        key: `${w}-${i}`,
        dayName: DAY_NAMES_SHORT[i],
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        fullDate: new Date(d),
        dateStr: formatLocalDate(d),
      });
    }

    weeks.push({
      key: `week-${w}`,
      days,
    });
  }

  return weeks;
}

// ─── Get current week's Monday and Sunday ───
function getCurrentWeekRange(baseDate: Date) {
  const dayOfWeek = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
}

// ─── Format date to Indonesian ───
function formatDateIndonesian(date: Date): string {
  return `${date.getDate()} . ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Horizontal Calendar Day Item ───
function CalendarDayItem({
  dayName, date, isSelected, isToday, taskIndicators, onPress,
}: {
  dayName: string;
  date: number;
  isSelected: boolean;
  isToday: boolean;
  taskIndicators: { isIcon: boolean, value: string }[];
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.dayItem,
        isSelected && styles.dayItemSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.dayName,
        isSelected && styles.dayNameSelected,
      ]}>
        {dayName}
      </Text>
      <Text style={[
        styles.dayDate,
        isSelected && styles.dayDateSelected,
        isToday && !isSelected && styles.dayDateToday,
      ]}>
        {date}
      </Text>
      {/* Task indicator icons below date */}
      <View style={styles.dayIndicators}>
        {taskIndicators.length > 0 ? (
          taskIndicators.slice(0, 3).map((ind, idx) => {
             const dotColors = [Colors.calendarDot, Colors.brownDark, Colors.brown];
             const defaultColor = dotColors[idx % dotColors.length];
             const color = isSelected ? Colors.white : defaultColor;

             if (ind.isIcon) {
               return <Ionicons key={idx} name={ind.value as any} size={sw(10)} color={color} />;
             } else {
               return <View key={idx} style={[styles.dotIndicator, { backgroundColor: color }]} />;
             }
          })
        ) : (
          <View style={{ height: sw(12) }} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Daily Task Card (Brown section) ───
function DailyTaskItem({ task }: { task: Task }) {
  const timeStr = task.scheduledStart && task.scheduledEnd
    ? `(${task.scheduledStart} - ${task.scheduledEnd})`
    : task.deadlineTime
    ? `( ${task.deadlineTime} )`
    : '';

  return (
    <View style={styles.dailyItem}>
      <View style={styles.dailyDot} />
      <View style={styles.dailyContent}>
        <Text style={styles.dailyTitle} numberOfLines={1}>
          {task.title}
        </Text>
        {timeStr ? (
          <Text style={styles.dailyTime}>{timeStr}</Text>
        ) : null}
      </View>
      {task.icon ? (
        <Ionicons name={task.icon as any} size={sw(18)} color={Colors.brownDark} />
      ) : null}
    </View>
  );
}

// ─── Weekly Task Row (White with border, green when completed) ───
function WeeklyTaskItem({
  task, onCheck,
}: {
  task: Task;
  onCheck: () => void;
}) {
  const taskDate = parseTaskDate(task.date);
  const dateLabel = taskDate
    ? `${taskDate.getDate()}  ${MONTHS_SHORT[taskDate.getMonth()]}`
    : '';

  const isCompleted = task.status === 'completed';

  return (
    <View style={[
      styles.weeklyItem, 
      isCompleted ? styles.weeklyItemCompleted : styles.weeklyItemActive
    ]}>
      <Text style={[
        styles.weeklyDate, 
        isCompleted && { textDecorationLine: 'line-through', color: Colors.white }
      ]}>
        {dateLabel}
      </Text>
      <Text style={[
        styles.weeklyTitle, 
        isCompleted && { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.8)' }
      ]} numberOfLines={1}>
        {task.title}
      </Text>
      <TouchableOpacity onPress={onCheck} activeOpacity={0.7}>
        <Ionicons 
          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
          size={sw(28)} 
          color={isCompleted ? Colors.white : Colors.textMuted} 
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── Mini Calendar Dropdosn ───
function MiniCalendarDropdown({
  visible, onClose, onSelectDate, selectedDate, tasks,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  tasks: Task[];
}) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const calDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const arr: Array<{ date: number; isCurrent: boolean; dateStr: string }> = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrev - i;
      const fd = new Date(year, month - 1, d);
      arr.push({ date: d, isCurrent: false, dateStr: formatLocalDate(fd) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const fd = new Date(year, month, i);
      arr.push({ date: i, isCurrent: true, dateStr: formatLocalDate(fd) });
    }
    const rem = 42 - arr.length;
    for (let i = 1; i <= rem; i++) {
      const fd = new Date(year, month + 1, i);
      arr.push({ date: i, isCurrent: false, dateStr: formatLocalDate(fd) });
    }
    return arr;
  }, [month, year]);

  // Build task indicator map
  const taskMap = useMemo(() => {
    const m: Record<string, boolean> = {};
    tasks.forEach((t) => {
      const d = parseTaskDate(t.date);
      if (d) m[formatLocalDate(d)] = true;
    });
    return m;
  }, [tasks]);

  const todayStr = formatLocalDate(new Date());
  const cellW = (SCREEN_WIDTH - sw(80)) / 7;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={miniStyles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={miniStyles.container}>
          {/* Month nav */}
          <View style={miniStyles.monthRow}>
            <TouchableOpacity onPress={() => {
              if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
            }}>
              <Ionicons name="chevron-back" size={sw(18)} color={Colors.brownDark} />
            </TouchableOpacity>
            <Text style={miniStyles.monthText}>{MONTHS_ID[month]} {year}</Text>
            <TouchableOpacity onPress={() => {
              if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
            }}>
              <Ionicons name="chevron-forward" size={sw(18)} color={Colors.brownDark} />
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={miniStyles.dayHeaderRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <Text key={i} style={[miniStyles.dayHeader, { width: cellW }]}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={miniStyles.grid}>
            {calDays.map((day, idx) => {
              const isSelected = day.dateStr === selectedDate;
              const isToday = day.dateStr === todayStr;
              const hasTask = taskMap[day.dateStr];

              return (
                <TouchableOpacity
                  key={idx}
                  style={[miniStyles.cell, { width: cellW }, isSelected && miniStyles.cellSelected]}
                  onPress={() => {
                    onSelectDate(day.dateStr);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    miniStyles.cellText,
                    !day.isCurrent && { opacity: 0.3 },
                    isSelected && { color: Colors.white, fontWeight: '700' },
                    isToday && !isSelected && { color: Colors.brownDark, fontWeight: '800' },
                  ]}>{day.date}</Text>
                  {hasTask && (
                    <View style={[miniStyles.dot, isSelected && { backgroundColor: Colors.white }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const miniStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.cream,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: SCREEN_WIDTH - sw(48),
    ...Shadow.lg,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  monthText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.brownDark,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeader: {
    textAlign: 'center',
    fontSize: FontSize.xxs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    paddingVertical: sw(5),
  },
  cellSelected: {
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.sm,
  },
  cellText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  dot: {
    width: sw(4),
    height: sw(4),
    borderRadius: sw(2),
    backgroundColor: Colors.calendarDot,
    marginTop: sw(1),
  },
});

// ─── Main Home Screen ───
export default function HomeScreen() {
  const { user } = useAuth();
  const { tasks, toggleStatus } = useTasks();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(today));
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  // Generate scrollable weeks (Bug 5)
  const weeks = useMemo(() => generateWeeks(today, 8, 8), []);
  const initialWeekIndex = 8; // center week

  // Get tasks for a specific date string
  const getTasksForDate = useCallback((dateStr: string) => {
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      if (!d) return false;
      return formatLocalDate(d) === dateStr && t.status !== 'completed';
    });
  }, [tasks]);

  // Tasks for selected date (daily section)
  const selectedDayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);

  // Current week range for weekly list (Bug 7)
  const { monday: weekStart, sunday: weekEnd } = useMemo(() => getCurrentWeekRange(new Date(selectedDate + 'T00:00:00')), [selectedDate]);

  // All tasks for the visible week (Bug 7)
  const weekTasks = useMemo(() => {
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      if (!d) return false;
      return d >= weekStart && d <= weekEnd;
    });
  }, [tasks, weekStart, weekEnd]);

  // Get task icons for each day
  const getTaskIndicatorsForDate = useCallback((dateStr: string) => {
    const dayTasks = getTasksForDate(dateStr);
    return dayTasks.map((t) => t.icon ? { isIcon: true, value: t.icon } : { isIcon: false, value: 'dot' });
  }, [getTasksForDate]);

  const todayStr = formatLocalDate(today);
  const isSelectedToday = selectedDate === todayStr;

  // Selected day label
  const selectedDayLabel = isSelectedToday ? 'Hari ini' : (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  })();

  // Current displayed date header
  const displayedDate = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    return formatDateIndonesian(d);
  }, [selectedDate]);

  const handleCheck = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await toggleStatus(taskId, task.status);
      }
    } catch {}
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  // Render a week row for the FlatList
  const renderWeekItem = useCallback(({ item }: { item: typeof weeks[0] }) => {
    return (
      <View style={styles.weekRow}>
        {item.days.map((day) => {
          const isToday = day.dateStr === todayStr;
          const isSelected = day.dateStr === selectedDate;
          const indicators = getTaskIndicatorsForDate(day.dateStr);

          return (
            <CalendarDayItem
              key={day.key}
              dayName={day.dayName}
              date={day.date}
              isSelected={isSelected}
              isToday={isToday}
              taskIndicators={indicators}
              onPress={() => setSelectedDate(day.dateStr)}
            />
          );
        })}
      </View>
    );
  }, [selectedDate, todayStr, getTaskIndicatorsForDate]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.brown}
          />
        }
      >
        {/* ── Header: Date + Avatar ── */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateTitle}>{displayedDate}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={sw(20)} color={Colors.cream} />
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ── Horizontal Week Calendar (Bug 5: Scrollable) ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <FlatList
            ref={flatListRef}
            data={weeks}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            renderItem={renderWeekItem}
            initialScrollIndex={initialWeekIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            style={styles.weekFlatList}
          />
        </Animated.View>

        {/* ── Daily Activities Section (Brown Card) ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.dailySection}>
          <TouchableOpacity
            style={styles.dailyHeader}
            onPress={() => setShowMiniCalendar(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dailyHeaderText}>{selectedDayLabel}</Text>
            <Ionicons name="chevron-down" size={sw(14)} color={Colors.white} />
          </TouchableOpacity>

          {selectedDayTasks.length > 0 ? (
            selectedDayTasks.map((task) => (
              <DailyTaskItem key={task.id} task={task} />
            ))
          ) : (
            <View style={styles.emptyDaily}>
              <Text style={styles.emptyDailyText}>Tidak ada kegiatan</Text>
            </View>
          )}
        </Animated.View>

        {/* ── Weekly Activities List*/}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyHeaderText}>List kegiatan dalam 1 Minggu</Text>
            <Ionicons name="menu" size={sw(18)} color={Colors.textPrimary} />
          </View>

          {weekTasks.length > 0 ? (
            weekTasks.map((task) => (
              <WeeklyTaskItem
                key={task.id}
                task={task}
                onCheck={() => handleCheck(task.id)}
              />
            ))
          ) : (
            <View style={styles.emptyWeekly}>
              <Text style={styles.emptyWeeklyText}>Belum ada jadwal minggu ini</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: sw(100) }} />
      </ScrollView>

      {/* Mini Calendar Modal (Bug 6) */}
      <MiniCalendarDropdown
        visible={showMiniCalendar}
        onClose={() => setShowMiniCalendar(false)}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
        tasks={tasks}
      />
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scrollView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.brownDark,
    letterSpacing: -0.3,
  },
  avatar: {
    width: sw(42),
    height: sw(42),
    borderRadius: sw(21),
    borderWidth: 2,
    borderColor: Colors.brownDark,
  },
  avatarPlaceholder: {
    width: sw(42),
    height: sw(42),
    borderRadius: sw(21),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Week Calendar (Bug 5: scrollable)
  weekFlatList: {
    marginBottom: Spacing.sm,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: SCREEN_WIDTH,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: sw(6),
    paddingHorizontal: sw(6),
    borderRadius: Radius.sm,
    minWidth: (SCREEN_WIDTH - sw(32)) / 7 - sw(4),
  },
  dayItemSelected: {
    backgroundColor: Colors.brownDark,
    borderRadius: Radius.md,
  },
  dayName: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: sw(2),
  },
  dayNameSelected: {
    color: Colors.white,
  },
  dayDate: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayDateSelected: {
    color: Colors.white,
  },
  dayDateToday: {
    color: Colors.brownDark,
  },
  dayIndicators: {
    flexDirection: 'row',
    gap: sw(2),
    marginTop: sw(3),
    height: sw(12),
    alignItems: 'center',
  },
  dotIndicator: { 
    width: sw(5), 
    height: sw(5), 
    borderRadius: sw(3) 
  },

  // Daily Section (Brown)
  dailySection: {
    backgroundColor: Colors.dailyCardBg,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sw(4),
    marginBottom: Spacing.md,
    paddingHorizontal: sw(4),
  },
  dailyHeaderText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: Colors.white,
  },
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(12),
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  dailyDot: {
    width: sw(8),
    height: sw(8),
    borderRadius: sw(4),
    backgroundColor: Colors.textMuted,
    marginRight: Spacing.sm,
  },
  dailyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dailyTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dailyTime: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyDaily: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyDailyText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    opacity: 0.7,
  },

  // Weekly Section
  weeklySection: {
    paddingHorizontal: Spacing.md,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: sw(4),
  },
  weeklyHeaderText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(14),
    marginBottom: Spacing.sm,
  },
  weeklyItemActive: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  weeklyItemCompleted: {
    backgroundColor: Colors.checkGreen,
    borderWidth: 0,
  },
  weeklyDate: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textPrimary,
    width: sw(70),
  },
  weeklyTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  emptyWeekly: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyWeeklyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
