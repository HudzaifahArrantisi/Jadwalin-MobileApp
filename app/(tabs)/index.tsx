import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task.types';
import { parseTaskDate } from '@/utils/date';
import { useAppTheme, Spacing, FontSize, Radius, SCREEN_WIDTH, sw, getTaskCardColor } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';
import GamificationCard from '@/components/GamificationCard';
import { useGamification } from '@/hooks/useGamification';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const CONTENT_PADDING = SCREEN_WIDTH < 360 ? Spacing.lg : Spacing.xl;
const WEEK_PAGE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;
const CALENDAR_CARD_GAP = sw(4);
const CALENDAR_CARD_WIDTH = (WEEK_PAGE_WIDTH - CALENDAR_CARD_GAP * 6) / 7;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonday = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getWeekOfMonth = (date: Date) => {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekStart = getMonday(monthStart);
  const currentWeekStart = getMonday(date);
  const diffMs = currentWeekStart.getTime() - firstWeekStart.getTime();
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
};

const getWeekInfoLabel = (weekDates: Date[]) => {
  const anchor = weekDates[3] || weekDates[0];
  if (!anchor) return 'Minggu ini';
  return `Minggu ke-${getWeekOfMonth(anchor)} ${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
};

const buildCalendarDates = (centerDate: Date) => {
  const start = addDays(getMonday(centerDate), -14);
  return Array.from({ length: 49 }, (_, index) => addDays(start, index));
};

const chunkWeeks = (dates: Date[]) => {
  const weeks: Date[][] = [];
  for (let index = 0; index < dates.length; index += 7) {
    weeks.push(dates.slice(index, index + 7));
  }
  return weeks;
};

const getTimeLabel = (task: Task) => {
  if (task.scheduledStart && task.scheduledEnd) return `${task.scheduledStart} - ${task.scheduledEnd}`;
  return task.scheduledStart || task.deadlineTime || 'Fleksibel';
};

const getTaskDateLabel = (task: Task) => {
  const date = parseTaskDate(task.date);
  if (!date) return '';
  return `${DAY_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
};

function EditorialCheckbox({ completed }: { completed: boolean }) {
  const { Colors, isDark } = useAppTheme();
  const progress = useSharedValue(completed ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(completed ? 1 : 0, { duration: 180 });
  }, [completed, progress]);

  const checkStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View
      style={[
        styles.checkboxBase,
        {
          borderColor: completed ? Colors.brownDark : Colors.inputBorder,
          backgroundColor: completed ? Colors.brownDark : 'transparent',
        },
      ]}
    >
      <Animated.View style={checkStyle}>
        <Ionicons name="checkmark" size={sw(14)} color={isDark ? Colors.black : Colors.white} />
      </Animated.View>
    </View>
  );
}

function TaskRow({ task, index, onToggle }: { task: Task; index: number; onToggle: () => void }) {
  const { Colors } = useAppTheme();
  const isCompleted = task.status === 'completed';
  const accent = getTaskCardColor(task.title || index);

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(360)}>
      <InteractivePressable style={[styles.taskCard, { backgroundColor: Colors.dailyCardBg, borderColor: Colors.dailyCardBorder }]} onPress={onToggle}>
        <View style={[styles.taskStrip, { backgroundColor: accent }]} />
        <View style={styles.taskBody}>
          <View style={styles.taskTopRow}>
            <Text style={[styles.taskTitle, { color: Colors.textPrimary }, isCompleted && styles.completedText]} numberOfLines={2}>
              {task.title}
            </Text>
            <Text style={[styles.taskTime, { color: Colors.textSecondary }]}>{getTimeLabel(task)}</Text>
          </View>
          {task.description ? (
            <Text style={[styles.taskDesc, { color: Colors.textSecondary }]} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
          <Text style={[styles.taskMeta, { color: Colors.textMuted }]}>
            {(task.category || 'schedule').toUpperCase()}
          </Text>
        </View>
        <EditorialCheckbox completed={isCompleted} />
      </InteractivePressable>
    </Animated.View>
  );
}

function CalendarDateCard({
  date,
  isSelected,
  isToday,
  tasksForDate,
  onPress,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  tasksForDate: Task[];
  onPress: () => void;
}) {
  const { Colors, isDark } = useAppTheme();
  const taskCount = tasksForDate.length;
  const selectedTextColor = isDark ? Colors.black : Colors.white;
  const hasTasks = taskCount > 0;
  const highlightPalette = [Colors.pastelGreen, Colors.pastelRose, Colors.pastelOat, Colors.pastelBlue, Colors.pastelLavender];
  const highlightIndex = dateKey(date).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % highlightPalette.length;
  const highlightBackground = highlightPalette[highlightIndex];
  const highlightBorder = getTaskCardColor(dateKey(date));
  const cardBackground = isSelected ? Colors.brownDark : hasTasks ? highlightBackground : Colors.dailyCardBg;
  const cardBorder = isSelected ? Colors.brownDark : hasTasks ? highlightBorder : Colors.dailyCardBorder;
  const scheduleBadgeColor = isSelected ? selectedTextColor : highlightBorder;
  const todayBadgeColor = isSelected ? selectedTextColor : Colors.calendarSelected;

  return (
    <InteractivePressable
      style={[
        styles.calendarCard,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorder,
        },
      ]}
      onPress={onPress}
    >
      {hasTasks || isToday ? (
        <View style={styles.calendarBadgeRow}>
          {hasTasks ? <View style={[styles.calendarBadge, { backgroundColor: scheduleBadgeColor }]} /> : null}
          {isToday ? <View style={[styles.calendarBadgeRing, { borderColor: todayBadgeColor }]} /> : null}
        </View>
      ) : null}
      <Text style={[styles.calendarDay, { color: isSelected ? selectedTextColor : Colors.textMuted }]}>
        {DAY_SHORT[date.getDay()]}
      </Text>
      <Text style={[styles.calendarDate, { color: isSelected ? selectedTextColor : Colors.textPrimary }]}>
        {date.getDate()}
      </Text>
      <Text style={[styles.calendarMonth, { color: isSelected ? selectedTextColor : Colors.textMuted }]}>
        {MONTHS_SHORT[date.getMonth()]}
      </Text>
      <View style={styles.calendarDots}>
        {Array.from({ length: Math.min(taskCount, 3) }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.calendarDot,
              { backgroundColor: isSelected ? selectedTextColor : getTaskCardColor(tasksForDate[index]?.title || index) },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.calendarActivity, { color: isSelected ? selectedTextColor : Colors.textSecondary }]} numberOfLines={1}>
        {taskCount > 0 ? `${taskCount} jadwal` : isToday ? 'Hari ini' : '-'}
      </Text>
    </InteractivePressable>
  );
}

function WeeklyTaskRow({ task, index, onToggle }: { task: Task; index: number; onToggle: () => void }) {
  const { Colors } = useAppTheme();
  const accent = getTaskCardColor(task.title || index);
  const isCompleted = task.status === 'completed';

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(320)}>
      <InteractivePressable
        style={[styles.weekTaskRow, { backgroundColor: Colors.dailyCardBg, borderColor: Colors.dailyCardBorder }]}
        onPress={onToggle}
      >
        <View style={[styles.weekTaskDot, { backgroundColor: accent }]} />
        <View style={styles.weekTaskBody}>
          <Text style={[styles.weekTaskDate, { color: Colors.textMuted }]}>{getTaskDateLabel(task)} · {getTimeLabel(task)}</Text>
          <Text style={[styles.weekTaskTitle, { color: Colors.textPrimary }, isCompleted && styles.completedText]} numberOfLines={1}>
            {task.title}
          </Text>
        </View>
        <EditorialCheckbox completed={isCompleted} />
      </InteractivePressable>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { tasks, isLoading, toggleStatus } = useTasks();
  const { Colors, isDark } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const { monthlyPoints, stats, level, levelProgress, userRank, refresh: refreshGamification } = useGamification();
  const [refreshing, setRefreshing] = useState(false);
  const [today, setToday] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleWeekIndex, setVisibleWeekIndex] = useState(0);
  const calendarScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);
    setSelectedDate(d);
  }, []);

  const calendarDates = useMemo(() => buildCalendarDates(today), [today]);
  const calendarWeeks = useMemo(() => chunkWeeks(calendarDates), [calendarDates]);
  const todayCalendarIndex = useMemo(
    () => calendarDates.findIndex((date) => sameDay(date, today)),
    [calendarDates, today]
  );
  const todayWeekIndex = todayCalendarIndex >= 0 ? Math.floor(todayCalendarIndex / 7) : 0;

  useEffect(() => {
    if (todayWeekIndex < 0) return;

    const timer = setTimeout(() => {
      setVisibleWeekIndex(todayWeekIndex);
      calendarScrollRef.current?.scrollTo({ x: todayWeekIndex * WEEK_PAGE_WIDTH, animated: false });
    }, 80);

    return () => clearTimeout(timer);
  }, [todayWeekIndex]);

  const selectedWeekDates = useMemo(() => {
    const visibleWeek = calendarWeeks[visibleWeekIndex];
    if (visibleWeek) return visibleWeek;

    const monday = getMonday(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  }, [calendarWeeks, selectedDate, visibleWeekIndex]);

  const selectedWeekTitle = useMemo(() => {
    const start = selectedWeekDates[0];
    const end = selectedWeekDates[6];
    return `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]} - ${end.getDate()} ${MONTHS_SHORT[end.getMonth()]}`;
  }, [selectedWeekDates]);

  const selectedWeekInfoLabel = useMemo(() => getWeekInfoLabel(selectedWeekDates), [selectedWeekDates]);

  const tasksByDate = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const parsed = parseTaskDate(task.date);
      if (!parsed || task.status === 'archived') return acc;
      const key = dateKey(parsed);
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const date = parseTaskDate(task.date);
        return date && sameDay(date, selectedDate) && task.status !== 'archived';
      })
      .sort((a, b) => getTimeLabel(a).localeCompare(getTimeLabel(b)));
  }, [tasks, selectedDate]);

  const selectedWeekTasks = useMemo(() => {
    const weekStart = selectedWeekDates[0];
    const weekEnd = new Date(selectedWeekDates[6]);
    weekEnd.setHours(23, 59, 59, 999);

    return tasks
      .filter((task) => {
        const date = parseTaskDate(task.date);
        return date && date >= weekStart && date <= weekEnd && task.status !== 'archived';
      })
      .sort((a, b) => {
        const da = parseTaskDate(a.date)?.getTime() || 0;
        const db = parseTaskDate(b.date)?.getTime() || 0;
        if (da !== db) return da - db;
        return getTimeLabel(a).localeCompare(getTimeLabel(b));
      });
  }, [tasks, selectedWeekDates]);

  const quote = `Hallo ${user?.name || 'Pengguna'}, Selamat datang di Applikasi Jadwalin`;
  const selectedDateLabel = `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]}`;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshGamification();
    setTimeout(() => setRefreshing(false), 450);
  }, [refreshGamification]);

  const handleToggle = async (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleStatus(task.id, task.status);
    if (task.status !== 'completed') {
      setTimeout(() => {
        refreshGamification();
      }, 700);
    }
  };

  const handleCalendarScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const rawIndex = Math.round(event.nativeEvent.contentOffset.x / WEEK_PAGE_WIDTH);
    const nextIndex = clamp(rawIndex, 0, calendarWeeks.length - 1);
    const nextWeek = calendarWeeks[nextIndex];

    if (!nextWeek) return;

    setVisibleWeekIndex(nextIndex);

    const preferredDate = nextWeek.find((date) => sameDay(date, today)) || nextWeek[0];
    if (preferredDate && !nextWeek.some((date) => sameDay(date, selectedDate))) {
      setSelectedDate(preferredDate);
    }
  };

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={screenStyles.content}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={Colors.brownDark} />}
      >
        <Animated.View entering={FadeInDown.duration(420)} style={screenStyles.header}>
          <View style={screenStyles.headerCopy}>
            <Text style={screenStyles.kicker}>JADWALIN</Text>
            <Text style={screenStyles.dateTitle}>
              {DAYS[today.getDay()]}, {today.getDate()} {MONTHS[today.getMonth()]}
            </Text>
            <Text style={screenStyles.quote}>{quote}</Text>
          </View>
          <InteractivePressable onPress={() => router.push('/(tabs)/settings')}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={screenStyles.avatar} />
            ) : (
              <View style={screenStyles.avatarPlaceholder}>
                <Text style={screenStyles.avatarInitial}>{(user?.name || 'J').charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </InteractivePressable>
        </Animated.View>
        <GamificationCard
          monthlyPoints={monthlyPoints}
          currentStreak={stats.currentStreak}
          levelName={level.name}
          levelEmoji={level.emoji}
          levelProgress={levelProgress}
          userRank={userRank}
        />
        <View style={screenStyles.calendarPanel}>
          <View style={screenStyles.sectionHeader}>
            <View>
              <Text style={screenStyles.sectionTitle}>Kalender Mingguan</Text>
              <Text style={screenStyles.sectionHint}>Senin sampai Minggu · geser kanan/kiri</Text>
            </View>
          </View>
          <ScrollView
            ref={calendarScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={screenStyles.calendarList}
            snapToInterval={WEEK_PAGE_WIDTH}
            decelerationRate="fast"
            onMomentumScrollEnd={handleCalendarScrollEnd}
            onScrollEndDrag={handleCalendarScrollEnd}
          >
            {calendarWeeks.map((week, weekIndex) => {
              const todayIndex = week.findIndex((date) => sameDay(date, today));
              const hasToday = todayIndex >= 0;

              return (
                <View key={weekIndex} style={{ width: WEEK_PAGE_WIDTH }}>
                  <View style={screenStyles.weekPage}>
                    {week.map((date) => (
                      <CalendarDateCard
                        key={dateKey(date)}
                        date={date}
                        isSelected={dateKey(date) === dateKey(selectedDate)}
                        isToday={sameDay(date, today)}
                        tasksForDate={tasksByDate[dateKey(date)] || []}
                        onPress={() => setSelectedDate(date)}
                      />
                    ))}
                  </View>
                  {hasToday ? (
                    <View 
                      style={[
                        screenStyles.calendarHint, 
                        { 
                          alignSelf: 'flex-start',
                          marginLeft: Math.max(0, todayIndex * (CALENDAR_CARD_WIDTH + CALENDAR_CARD_GAP) + (CALENDAR_CARD_WIDTH / 2) - sw(25))
                        }
                      ]}
                    >
                      <Ionicons name="arrow-up" size={sw(14)} color={Colors.danger} />
                      <Text style={[screenStyles.calendarHintText, { color: Colors.danger }]}>Hari ini</Text>
                    </View>
                  ) : (
                    <View style={{ height: sw(22) }} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={screenStyles.sectionHeader}>
          <View>
            <Text style={screenStyles.sectionTitle}>Agenda Hari Ini</Text>
            <Text style={screenStyles.sectionHint}>{selectedDateLabel} · {selectedDateTasks.length} kegiatan</Text>
          </View>
        </View>

        {selectedDateTasks.length > 0 ? (
          selectedDateTasks.map((task, index) => (
            <TaskRow key={task.id} task={task} index={index} onToggle={() => handleToggle(task)} />
          ))
        ) : (
          <View style={screenStyles.emptyBox}>
            <Text style={screenStyles.emptyTitle}>Belum ada agenda di tanggal ini.</Text>
            <Text style={screenStyles.emptyText}>Pilih tanggal lain atau tambahkan jadwal baru.</Text>
          </View>
        )}

        <View style={screenStyles.sectionHeader}>
          <View>
            <Text style={screenStyles.sectionTitle}>List Kegiatan 1 Minggu</Text>
            <Text style={screenStyles.sectionHint}>{selectedWeekInfoLabel} · {selectedWeekTitle} · {selectedWeekTasks.length} kegiatan</Text>
          </View>
          <InteractivePressable onPress={() => router.push('/(tabs)/calendar?add=true')} style={screenStyles.addMini}>
            <Ionicons name="add" size={sw(18)} color={isDark ? Colors.black : Colors.white} />
          </InteractivePressable>
        </View>

        {selectedWeekTasks.length > 0 ? (
          selectedWeekTasks.map((task, index) => (
            <WeeklyTaskRow key={task.id} task={task} index={index} onToggle={() => handleToggle(task)} />
          ))
        ) : (
          <View style={screenStyles.emptyBox}>
            <Text style={screenStyles.emptyTitle}>Belum ada kegiatan minggu ini.</Text>
            <Text style={screenStyles.emptyText}>Pilih tanggal di kalender atau tambah jadwal baru.</Text>
          </View>
        )}


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkboxBase: {
    width: sw(24),
    height: sw(24),
    borderRadius: sw(12),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  taskCard: {
    minHeight: sw(86),
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingRight: Spacing.md,
  },
  taskStrip: { width: sw(4) },
  taskBody: { flex: 1, paddingVertical: Spacing.md, paddingLeft: Spacing.md },
  taskTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  taskTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '600' },
  taskTime: { fontSize: FontSize.xs, fontWeight: '500', paddingTop: sw(2) },
  taskDesc: { fontSize: FontSize.xs, lineHeight: sw(18), marginTop: Spacing.xs },
  taskMeta: { fontSize: FontSize.xxs, letterSpacing: 1.4, marginTop: Spacing.sm },
  completedText: { textDecorationLine: 'line-through', opacity: 0.55 },
  calendarCard: {
    width: CALENDAR_CARD_WIDTH,
    minHeight: clamp(SCREEN_WIDTH * 0.22, sw(86), sw(106)),
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: sw(4),
    alignItems: 'center',
  },
  calendarBadgeRow: { position: 'absolute', top: sw(6), right: sw(6), flexDirection: 'row', alignItems: 'center', gap: sw(3) },
  calendarBadge: { width: sw(7), height: sw(7), borderRadius: sw(4) },
  calendarBadgeRing: { width: sw(9), height: sw(9), borderRadius: sw(5), borderWidth: 1 },
  calendarDay: { fontSize: FontSize.xxs, letterSpacing: 0.6, textTransform: 'uppercase' },
  calendarDate: { fontSize: FontSize.lg, fontWeight: '700', marginTop: Spacing.xs },
  calendarMonth: { fontSize: FontSize.xxs, marginTop: sw(2) },
  calendarDots: { height: sw(8), flexDirection: 'row', alignItems: 'center', gap: sw(2), marginTop: Spacing.xs },
  calendarDot: { width: sw(4), height: sw(4), borderRadius: sw(2) },
  calendarActivity: { fontSize: FontSize.xxs, lineHeight: sw(14), marginTop: Spacing.xs, textAlign: 'center' },
  weekTaskRow: {
    minHeight: sw(70),
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  weekTaskDot: { width: sw(8), height: sw(8), borderRadius: sw(4), marginRight: Spacing.md },
  weekTaskBody: { flex: 1 },
  weekTaskDate: { fontSize: FontSize.xxs, marginBottom: sw(3) },
  weekTaskTitle: { fontSize: FontSize.sm, fontWeight: '700' },
});

const makeStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.cream },
  content: { paddingHorizontal: CONTENT_PADDING, paddingBottom: sw(132) },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.lg },
  headerCopy: { flex: 1 },
  kicker: { fontSize: FontSize.xxs, color: Colors.textMuted, letterSpacing: 2, marginBottom: Spacing.sm },
  dateTitle: { fontSize: FontSize.hero, color: Colors.textPrimary, fontWeight: '700', lineHeight: sw(35) },
  quote: { marginTop: Spacing.sm, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: sw(20) },
  avatar: { width: sw(48), height: sw(48), borderRadius: sw(24), borderWidth: 1, borderColor: Colors.borderLight },
  avatarPlaceholder: {
    width: sw(48),
    height: sw(48),
    borderRadius: sw(24),
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: Colors.textLight, fontSize: FontSize.lg, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', marginTop: Spacing.xl, marginBottom: Spacing.xl, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.borderLight },
  statBlock: { flex: 1, paddingVertical: Spacing.md, borderRightWidth: 1, borderRightColor: Colors.borderLight },
  statValue: { fontSize: FontSize.xxl, color: Colors.textPrimary, fontWeight: '700' },
  statLabel: { marginTop: Spacing.xs, fontSize: FontSize.xs, color: Colors.textSecondary },
  calendarPanel: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.profileFormBg,
  },
  calendarList: { paddingRight: 0 },
  calendarHint: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  calendarHintText: { fontSize: FontSize.xs, fontWeight: '600', marginLeft: Spacing.xs },
  weekPage: {
    width: WEEK_PAGE_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: CALENDAR_CARD_GAP,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, color: Colors.textPrimary, fontWeight: '700' },
  sectionHint: { fontSize: FontSize.xs, color: Colors.textMuted },
  addMini: {
    width: sw(34),
    height: sw(34),
    borderRadius: Radius.full,
    backgroundColor: Colors.brownDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.borderLight, borderRadius: Radius.md, padding: Spacing.lg, marginBottom: Spacing.lg },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: Spacing.xs, lineHeight: sw(20) },
});
