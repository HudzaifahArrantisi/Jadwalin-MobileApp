import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, RefreshControl, FlatList, Modal, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeInDown, FadeIn, FadeInRight, SlideInRight, SlideOutRight,
  Layout, useSharedValue, useAnimatedStyle, 
  withSpring, withTiming, runOnJS 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';
import { useAppTheme, Spacing, FontSize, Radius, Shadow, sw, sh, SCREEN_WIDTH, getTaskCardColor, TASK_CARD_COLORS } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

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
function formatDateIndonesian(date: Date): { dayMonth: string, year: string } {
  return {
    dayMonth: `${date.getDate()} . ${MONTHS_ID[date.getMonth()]}`,
    year: `${date.getFullYear()}`
  };
}

// ─── Horizontal Calendar Day Item ───
function CalendarDayItem({
  dayName, date, isSelected, isPast, hasNextPast, isToday, taskIndicators, onPress,
}: {
  dayName: string;
  date: number;
  isSelected: boolean;
  isPast?: boolean;
  hasNextPast?: boolean;
  isToday: boolean;
  taskIndicators: { isIcon: boolean, value: string }[];
  onPress: () => void;
}) {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);
  
  const isPurple = isSelected || isPast;
  const ITEM_WIDTH = (SCREEN_WIDTH - sw(48)) / 7;

  return (
    <View style={{ width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
      {/* Garis penyambung antar tanggal terlewat */}
      {isPast && hasNextPast && (
        <Animated.View 
          entering={FadeIn.delay(300).duration(600)}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: ITEM_WIDTH,
            height: 4,
            backgroundColor: Colors.brownDark,
            zIndex: 0,
            marginTop: -sw(6)
          }} 
        />
      )}
      <InteractivePressable
        style={[styles.dayItem, { zIndex: 1 }]}
        onPress={onPress}
        hapticType={Haptics.ImpactFeedbackStyle.Light}
      >
        <Text style={styles.dayName}>
          {dayName}
        </Text>
        <View style={[styles.dateCircle, isPurple && styles.dateCircleSelected]}>
          <Text style={[styles.dayDate, isPurple && styles.dayTextSelected]}>
            {date}
          </Text>
        </View>
        {/* Task indicator icons below date */}
        <View style={styles.dayIndicators}>
          {taskIndicators.length > 0 ? (
            taskIndicators.slice(0, 3).map((ind, idx) => {
               const dotColors = ['#A855F7', '#38BDF8', '#22C55E'];
               const defaultColor = dotColors[idx % dotColors.length];
               
               return (
                 <View key={idx} style={[styles.indicatorWrapper, { backgroundColor: defaultColor, marginLeft: idx > 0 ? -sw(6) : 0 }]}>
                   {ind.isIcon ? (
                     <Ionicons name={ind.value as any} size={sw(8)} color={Colors.white} />
                   ) : (
                     <View style={styles.dotIndicatorInner} />
                   )}
                 </View>
               );
            })
          ) : (
            <View style={{ height: sw(14) }} />
          )}
        </View>
      </InteractivePressable>
    </View>
  );
}

function DailyTaskItem({ task, index, onCheck }: { task: Task, index: number, onCheck: () => void }) {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);
  const timeStr = task.scheduledStart && task.scheduledEnd
    ? `${task.scheduledStart} - ${task.scheduledEnd}`
    : task.deadlineTime
    ? task.deadlineTime
    : '';
  const cardColor = getTaskCardColor(task.title || index);
  const isCompleted = task.status === 'completed';

  return (
    <Animated.View 
      entering={FadeInRight.delay(index * 100).duration(400).springify()}
      layout={Layout.springify()}
      style={styles.dailyRow}
    >
      <View style={[styles.dailyItem, { backgroundColor: cardColor }, isCompleted && { opacity: 0.7 }]}>
        {task.icon ? (
          <View style={styles.dailyIconWrap}>
            <Ionicons name={task.icon as any} size={sw(18)} color={Colors.white} />
          </View>
        ) : null}
        <View style={styles.dailyTextWrap}>
          <Text style={[styles.dailyTitle, isCompleted && { textDecorationLine: 'line-through' }]} numberOfLines={1}>
            {task.title}
          </Text>
          {timeStr ? (
            <Text style={[styles.dailyTime, isCompleted && { textDecorationLine: 'line-through' }]}>{timeStr}</Text>
          ) : null}
        </View>
        <InteractivePressable style={styles.dailyCheckBtn} onPress={onCheck}>
          {isCompleted && (
            <Ionicons name="checkmark" size={sw(20)} color={cardColor} />
          )}
        </InteractivePressable>
      </View>
    </Animated.View>
  );
}

// ─── Weekly Task Row (White with border, green when completed) ───
function WeeklyTaskItem({
  task, index, onCheck,
}: {
  task: Task;
  index: number;
  onCheck: () => void;
}) {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);

  const taskDate = parseTaskDate(task.date);
  const dateLabel = taskDate
    ? `${taskDate.getDate()}  ${MONTHS_SHORT[taskDate.getMonth()]}`
    : '';

  const isCompleted = task.status === 'completed';

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400).springify()}
      layout={Layout.springify()}
    >
      <InteractivePressable 
        onPress={onCheck}
        hapticType={Haptics.ImpactFeedbackStyle.Medium}
        style={[styles.weeklyItem, isCompleted && { opacity: 0.6 }]}
      >
        <Text style={[styles.weeklyDate, isCompleted && { textDecorationLine: 'line-through' }]}>
          {dateLabel}
        </Text>
        <Text style={[styles.weeklyTitle, isCompleted && { textDecorationLine: 'line-through' }]} numberOfLines={1}>
          {task.title}
        </Text>
        <Ionicons 
          name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
          size={sw(24)} 
          color={isCompleted ? "#19D231" : Colors.brown} 
        />
      </InteractivePressable>
    </Animated.View>
  );
}

// ─── Mini Calendar Dropdown ───
function MiniCalendarDropdown({
  visible, onClose, onSelectDate, selectedDate, tasks,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  selectedDate: string;
  tasks: Task[];
}) {
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);

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

  const taskMap = useMemo(() => {
    const m: Record<string, string[]> = {};
    tasks.forEach((t) => {
      const d = parseTaskDate(t.date);
      if (d) {
        const key = formatLocalDate(d);
        if (!m[key]) m[key] = [];
        if (t.icon) m[key].push(t.icon);
      }
    });
    return m;
  }, [tasks]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <Animated.View 
          entering={FadeInDown.duration(300).springify()}
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              if (month === 0) { setMonth(11); setYear(y => y - 1); } else { setMonth(m => m - 1); }
            }}>
              <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalMonthText}>{MONTHS_ID[month]} {year}</Text>
            <TouchableOpacity onPress={() => {
              if (month === 11) { setMonth(0); setYear(y => y + 1); } else { setMonth(m => m + 1); }
            }}>
              <Ionicons name="chevron-forward" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDaysRow}>
            {DAY_NAMES_SHORT.map((d, i) => (
              <Text key={i} style={styles.modalDayName}>{d}</Text>
            ))}
          </View>

          <View style={styles.modalDaysGrid}>
            {calDays.map((d, i) => {
              const isSelected = d.dateStr === selectedDate;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.modalDayCell, isSelected && styles.modalDaySelected]}
                  onPress={() => { onSelectDate(d.dateStr); onClose(); }}
                >
                  <Text style={[
                    styles.modalDayText,
                    !d.isCurrent && { color: Colors.textMuted },
                    isSelected && { color: Colors.white, fontWeight: 'bold' }
                  ]}>
                    {d.date}
                  </Text>
                  {taskMap[d.dateStr] && (
                    <View style={styles.modalTaskDot} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Home Screen ───
export default function HomeScreen() {
  const { user } = useAuth();
  const { tasks, toggleStatus } = useTasks();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { Colors, isDark } = useAppTheme();
  const styles = useMemo(() => getStyles(Colors, isDark), [Colors, isDark]);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatLocalDate(today));
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const [isWeeklyListVisible, setIsWeeklyListVisible] = useState(true);
  const [toasts, setToasts] = useState<{ id: string, message: string }[]>([]);

  const triggerToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const weeks = useMemo(() => generateWeeks(today, 8, 8), []);
  const initialWeekIndex = 8; // center week

  const getTasksForDate = useCallback((dateStr: string) => {
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      if (!d) return false;
      return formatLocalDate(d) === dateStr;
    });
  }, [tasks]);

  const selectedDayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, getTasksForDate]);

  const { monday: weekStart, sunday: weekEnd } = useMemo(() => getCurrentWeekRange(new Date(selectedDate + 'T00:00:00')), [selectedDate]);

  const weekTasks = useMemo(() => {
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      if (!d) return false;
      return d >= weekStart && d <= weekEnd;
    });
  }, [tasks, weekStart, weekEnd]);

  const getTaskIndicatorsForDate = useCallback((dateStr: string) => {
    const dayTasks = getTasksForDate(dateStr);
    return dayTasks.map((t) => t.icon ? { isIcon: true, value: t.icon } : { isIcon: false, value: 'dot' });
  }, [getTasksForDate]);

  const todayStr = formatLocalDate(today);
  const isSelectedToday = selectedDate === todayStr;

  const tasksThisMonth = useMemo(() => {
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      return d && d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.status !== 'completed';
    }).length;
  }, [tasks, today]);

  const tasksThisWeek = useMemo(() => {
    const { monday, sunday } = getCurrentWeekRange(today);
    return tasks.filter((t) => {
      const d = parseTaskDate(t.date);
      return d && d >= monday && d <= sunday && t.status !== 'completed';
    }).length;
  }, [tasks, today]);

  const selectedDayLabel = isSelectedToday ? 'Hari ini' : (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  })();

  const displayedDate = useMemo(() => {
    return formatDateIndonesian(today);
  }, []);

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

  const renderWeekItem = useCallback(({ item }: { item: typeof weeks[0] }) => {
    return (
      <View style={styles.weekRow}>
        {item.days.map((day, index) => {
          const isToday = day.dateStr === todayStr;
          const isSelected = day.dateStr === selectedDate;
          const indicators = getTaskIndicatorsForDate(day.dateStr);
          const isPast = day.dateStr < todayStr;
          const nextDay = item.days[index + 1];
          const hasNextPast = nextDay ? (nextDay.dateStr < todayStr) : false;

          return (
            <CalendarDayItem
              key={day.key}
              dayName={day.dayName}
              date={day.date}
              isSelected={isSelected}
              isPast={isPast}
              hasNextPast={hasNextPast}
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
    <View style={[styles.container]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + sw(10) }]}>
        <InteractivePressable 
          style={styles.headerLeft}
          onPress={() => setShowMiniCalendar(true)}
        >
          <Text style={styles.dateTitle}>
            {displayedDate.dayMonth} <Text style={styles.dateYear}>{displayedDate.year}</Text>
          </Text>
          <View style={styles.statsBadgeRow}>
            <View style={styles.miniStatsBadge}>
              <Text style={styles.miniStatsValue}>{tasksThisMonth}</Text>
              <Text style={styles.miniStatsLabel}>Kegiatan Bulan ini</Text>
            </View>
            <View style={styles.miniStatsBadge}>
              <Text style={styles.miniStatsValue}>{tasksThisWeek}</Text>
              <Text style={styles.miniStatsLabel}>Kegiatan Minggu ini</Text>
            </View>
          </View>
        </InteractivePressable>
        <InteractivePressable
          onPress={() => router.push('/(tabs)/settings')}
          hapticType={Haptics.ImpactFeedbackStyle.Light}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={sw(24)} color={Colors.white} />
            </View>
          )}
        </InteractivePressable>
      </View>

      {/* ── Horizontal Week Calendar ── */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
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



        {/* ── Daily Activities Section (Brown Card) ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.dailySection}>
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyHeaderText}>{selectedDayLabel}</Text>
          </View>

          {selectedDayTasks.length > 0 ? (
            <View style={styles.dailyList}>
              {selectedDayTasks.map((task, index) => (
                <DailyTaskItem 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  onCheck={() => {
                    handleCheck(task.id);
                    if (task.status !== 'completed') {
                      triggerToast(`Jadwal ${task.title} selesai`);
                    }
                  }}
                />
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyDaily}>
              <Text style={styles.emptyDailyText}>Tidak ada kegiatan</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Weekly Activities List */}
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()} style={styles.weeklySection}>
          <InteractivePressable 
            style={styles.weeklyHeader}
            onPress={() => setIsWeeklyListVisible(!isWeeklyListVisible)}
            hapticType={Haptics.ImpactFeedbackStyle.Light}
          >
            <Text style={styles.weeklyHeaderText}>List kegiatan dalam 1 Minggu </Text>
          </InteractivePressable>

          {isWeeklyListVisible && (
            weekTasks.length > 0 ? (
              <View>
                {weekTasks.map((task, index) => (
                  <WeeklyTaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    onCheck={() => {
                      handleCheck(task.id);
                      if (task.status !== 'completed') {
                        triggerToast(`Jadwal ${task.title} selesai`);
                      }
                    }}
                  />
                ))}
              </View>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} style={styles.emptyWeekly}>
                <Text style={styles.emptyWeeklyText}>Belum ada jadwal minggu ini</Text>
              </Animated.View>
            )
          )}
        </Animated.View>

        <View style={{ height: sw(120) }} />
      </ScrollView>

      {/* Mini Calendar Modal */}
      <MiniCalendarDropdown
        visible={showMiniCalendar}
        onClose={() => setShowMiniCalendar(false)}
        onSelectDate={setSelectedDate}
        selectedDate={selectedDate}
        tasks={tasks}
      />

      {/* Custom Toast Notification */}
      <View style={[styles.toastWrapper, { top: insets.top + sw(20) }]} pointerEvents="none">
        {toasts.map((toast) => (
          <Animated.View 
            key={toast.id}
            entering={SlideInRight.springify()} 
            exiting={SlideOutRight.duration(300)}
            style={styles.toastContainer}
          >
            <Ionicons name="checkmark-circle" size={sw(20)} color={Colors.white} />
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles (Dynamic) ───
const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
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
    paddingBottom: Spacing.md,
    backgroundColor: Colors.beige,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  headerLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  dateTitle: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  dateYear: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statsBadgeRow: {
    flexDirection: 'row',
    gap: sw(6),
    marginTop: sw(4),
  },
  miniStatsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(139, 115, 85, 0.08)',
    paddingHorizontal: sw(8),
    paddingVertical: sw(3),
    borderRadius: Radius.sm,
  },
  miniStatsValue: {
    fontSize: FontSize.xxs,
    fontWeight: '800',
    color: Colors.brownDark,
    marginRight: sw(3),
  },
  miniStatsLabel: {
    fontSize: FontSize.xxs - 1,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  avatar: {
    width: sw(46),
    height: sw(46),
    borderRadius: sw(23),
    borderWidth: 2,
    borderColor: Colors.brownDark,
  },
  avatarPlaceholder: {
    width: sw(46),
    height: sw(46),
    borderRadius: sw(23),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5A4AD4',
  },

  // Week Calendar
  weekFlatList: {
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cream,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    width: SCREEN_WIDTH,
  },
  dayItem: {
    alignItems: 'center',
    width: sw(42),
    paddingVertical: sw(10),
    borderRadius: Radius.full,
  },
  dateCircle: {
    width: sw(34),
    height: sw(34),
    borderRadius: sw(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: Colors.brownDark,
    ...Shadow.glow,
  },
  dayName: {
    fontSize: FontSize.xxs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: sw(4),
  },
  dayDate: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    color: Colors.white,
  },
  dayIndicators: {
    flexDirection: 'row',
    marginTop: sw(6),
    height: sw(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorWrapper: {
    width: sw(14),
    height: sw(14),
    borderRadius: sw(7),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.cream,
  },
  dotIndicatorInner: { 
    width: sw(4), 
    height: sw(4), 
    borderRadius: sw(2),
    backgroundColor: Colors.checkGreen,
  },

  // Daily Section
  dailySection: {
    backgroundColor: Colors.dailyCardBg,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  toastWrapper: {
    position: 'absolute',
    right: Spacing.md,
    zIndex: 100,
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  toastContainer: {
    backgroundColor: Colors.brownDark,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadow.md,
  },
  toastText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
  },
  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dailyHeaderText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dailyList: {
    gap: Spacing.sm,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(14),
  },
  dailyIconWrap: {
    width: sw(32),
    height: sw(32),
    borderRadius: sw(10),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  dailyTextWrap: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
  dailyTime: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: sw(2),
  },
  dailyCheckBtn: {
    width: sw(32),
    height: sw(32),
    borderRadius: sw(16),
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  emptyDaily: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyDailyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    opacity: 0.8,
    fontWeight: '500',
  },

  // Weekly Section
  weeklySection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingHorizontal: sw(4),
  },
  weeklyHeaderText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    backgroundColor: Colors.beige,
    paddingHorizontal: Spacing.md,
    paddingVertical: sw(16),
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  weeklyDate: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: sw(70),
  },
  weeklyTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  emptyWeekly: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Colors.beige,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.inputBorder,
  },
  emptyWeeklyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },

  // Modal styles (mini calendar)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.beige, borderRadius: Radius.xl, padding: Spacing.lg, width: SCREEN_WIDTH - sw(48), ...Shadow.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalMonthText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  modalDaysRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  modalDayName: { flex: 1, textAlign: 'center', fontSize: FontSize.xxs, fontWeight: '600', color: Colors.textMuted },
  modalDaysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  modalDayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: sw(8), borderRadius: Radius.sm },
  modalDaySelected: { backgroundColor: Colors.brownDark },
  modalDayText: { fontSize: FontSize.sm, color: Colors.textPrimary },
  modalTaskDot: { width: sw(4), height: sw(4), borderRadius: sw(2), backgroundColor: Colors.brown, marginTop: sw(2) },
});
