// ============================================
// Jadwalin App — Leaderboard Screen
// ============================================

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { LeaderboardEntry, getUserLevel } from '@/types/gamification.types';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';
import InteractivePressable from '@/components/InteractivePressable';

const MONTHS_LABEL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  return `${MONTHS_LABEL[monthIndex] ?? month} ${year}`;
}

function PodiumCard({
  entry,
  rank,
  isCurrentUser,
  onPress,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  onPress: () => void;
}) {
  const { Colors } = useAppTheme();
  const level = getUserLevel(entry.points);
  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const medalColor = medalColors[rank - 1] || Colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(rank * 80).duration(360)}
    >
      <InteractivePressable
        accessibilityRole="button"
        accessibilityLabel={`Lihat profil ${entry.displayName || 'User'}`}
        accessibilityHint="Menampilkan detail profil pengguna"
        onPress={onPress}
        style={[
          styles.podiumCard,
          {
            backgroundColor: isCurrentUser
              ? Colors.pastelLavender
              : Colors.dailyCardBg,
            borderColor: isCurrentUser ? Colors.brownDark : Colors.dailyCardBorder,
            borderWidth: isCurrentUser ? 2 : 1,
          },
        ]}
      >
        {/* Rank medal */}
        <View style={[styles.rankCircle, { backgroundColor: medalColor }]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>

        {/* Avatar */}
        {entry.photoURL ? (
          <Image source={{ uri: entry.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.brownDark }]}>
            <Text style={styles.avatarInitial}>
              {(entry.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.entryInfo}>
          <Text
            style={[styles.entryName, { color: Colors.textPrimary }]}
            numberOfLines={1}
          >
            {entry.displayName || 'User'}
            {isCurrentUser ? ' (Kamu)' : ''}
          </Text>
          <Text style={[styles.entryLevel, { color: Colors.textMuted }]}>
            {level.emoji} {level.name}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.entryRight}>
          <Text style={[styles.entryPoints, { color: Colors.brownDark }]}>
            {entry.points}
          </Text>
          <Text style={[styles.entryPointsLabel, { color: Colors.textMuted }]}>
            poin
          </Text>
        </View>
      </InteractivePressable>
    </Animated.View>
  );
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  index,
  onPress,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  index: number;
  onPress: () => void;
}) {
  const { Colors } = useAppTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <InteractivePressable
        accessibilityRole="button"
        accessibilityLabel={`Lihat profil ${entry.displayName || 'User'}`}
        accessibilityHint="Menampilkan detail profil pengguna"
        onPress={onPress}
        style={[
          styles.listRow,
          {
            backgroundColor: isCurrentUser
              ? Colors.pastelLavender
              : Colors.dailyCardBg,
            borderColor: isCurrentUser ? Colors.brownDark : Colors.dailyCardBorder,
            borderWidth: isCurrentUser ? 2 : 1,
          },
        ]}
      >
        <Text style={[styles.listRank, { color: Colors.textMuted }]}>
          {rank}
        </Text>

        {entry.photoURL ? (
          <Image source={{ uri: entry.photoURL }} style={styles.listAvatar} />
        ) : (
          <View style={[styles.listAvatarPlaceholder, { backgroundColor: Colors.brownDark }]}>
            <Text style={styles.listAvatarInitial}>
              {(entry.displayName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.listInfo}>
          <Text
            style={[styles.listName, { color: Colors.textPrimary }]}
            numberOfLines={1}
          >
            {entry.displayName || 'User'}
            {isCurrentUser ? ' (Kamu)' : ''}
          </Text>
          <View style={styles.listMetaRow}>
            <Ionicons name="flame" size={sw(10)} color={Colors.warning} />
            <Text style={[styles.listMeta, { color: Colors.textMuted }]}>
              {entry.currentStreak} streak
            </Text>
            <Text style={[styles.listMeta, { color: Colors.textMuted }]}>
              · {entry.completedTasks} tugas
            </Text>
          </View>
        </View>

        <Text style={[styles.listPoints, { color: Colors.brownDark }]}>
          {entry.points}
        </Text>
      </InteractivePressable>
    </Animated.View>
  );
}

export default function LeaderboardScreen() {
  const { Colors } = useAppTheme();
  const screenStyles = useMemo(() => makeStyles(Colors), [Colors]);
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = React.useState<LeaderboardEntry | null>(null);
  const [selectedRank, setSelectedRank] = React.useState(0);
  const {
    leaderboard,
    monthKey,
    monthlyPoints,
    stats,
    level,
    userRank,
    isLoading,
    error,
    refresh,
  } = useGamification();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const selectedLevel = selectedEntry ? getUserLevel(selectedEntry.points) : null;
  const handleSelectEntry = React.useCallback((entry: LeaderboardEntry, rank: number) => {
    setSelectedEntry(entry);
    setSelectedRank(rank);
  }, []);
  const closeProfile = React.useCallback(() => {
    setSelectedEntry(null);
    setSelectedRank(0);
  }, []);

  return (
    <View style={[screenStyles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={screenStyles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.brownDark}
          />
        }
      >
        {/* Header */}
        <View style={screenStyles.header}>
          <View>
            <Text style={screenStyles.kicker}>JADWALIN LEAGUE</Text>
            <Text style={screenStyles.title}>Leaderboard</Text>
          </View>
          <View style={screenStyles.monthBadge}>
            <Ionicons name="calendar" size={sw(14)} color={Colors.brownDark} />
            <Text style={screenStyles.monthText}>{getMonthLabel(monthKey)}</Text>
          </View>
        </View>

        {/* User's own quick summary */}
        <Animated.View entering={FadeInDown.delay(40).duration(340)}>
          <View style={[screenStyles.summaryCard, { backgroundColor: Colors.dailyCardBg, borderColor: Colors.dailyCardBorder }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.brownDark }]}>
                  {monthlyPoints}
                </Text>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>
                  Poin kamu
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.brownDark }]}>
                  {stats.currentStreak}
                </Text>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>
                  Streak
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.brownDark }]}>
                  {userRank > 0 ? `#${userRank}` : '-'}
                </Text>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>
                  Ranking
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: Colors.brownDark }]}>
                  {level.emoji}
                </Text>
                <Text style={[styles.summaryLabel, { color: Colors.textMuted }]}>
                  {level.name}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Top 3 podium */}
        {top3.length > 0 && (
          <View style={screenStyles.sectionHeader}>
            <Text style={screenStyles.sectionTitle}>Top 3</Text>
          </View>
        )}
        {top3.map((entry, index) => (
          <PodiumCard
            key={entry.uid}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.uid === user?.uid}
            onPress={() => handleSelectEntry(entry, index + 1)}
          />
        ))}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <View style={screenStyles.sectionHeader}>
            <Text style={screenStyles.sectionTitle}>Peringkat Lainnya</Text>
          </View>
        )}
        {rest.map((entry, index) => (
          <LeaderboardRow
            key={entry.uid}
            entry={entry}
            rank={index + 4}
            isCurrentUser={entry.uid === user?.uid}
            index={index}
            onPress={() => handleSelectEntry(entry, index + 4)}
          />
        ))}

        {/* Empty state */}
        {!isLoading && leaderboard.length === 0 && (
          <Animated.View entering={FadeInDown.duration(360)}>
            <View style={screenStyles.emptyBox}>
              <Ionicons
                name="trophy-outline"
                size={sw(48)}
                color={Colors.textMuted}
                style={{ marginBottom: Spacing.md }}
              />
              <Text style={screenStyles.emptyTitle}>
                Belum ada data leaderboard.
              </Text>
              <Text style={screenStyles.emptyText}>
                Mulai selesaikan jadwal untuk mengumpulkan poin dan tampil di sini!
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Error indicator (non-blocking) */}
        {error && !isLoading && (
          <Text style={screenStyles.errorText}>{error}</Text>
        )}
      </ScrollView>
      <Modal
        transparent
        animationType="fade"
        visible={!!selectedEntry}
        onRequestClose={closeProfile}
      >
        <View style={screenStyles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tutup profil"
            accessibilityHint="Menutup detail profil"
            onPress={closeProfile}
            style={screenStyles.modalBackdrop}
          />
          <View style={screenStyles.modalContent}>
            <Animated.View
              entering={FadeInDown.duration(220)}
              style={[
                screenStyles.modalCard,
                { backgroundColor: Colors.profileBg, borderColor: Colors.dailyCardBorder },
              ]}
            >
              <View style={screenStyles.modalHeader}>
                {selectedEntry?.photoURL ? (
                  <Image source={{ uri: selectedEntry.photoURL }} style={screenStyles.modalAvatar} />
                ) : (
                  <View style={[screenStyles.modalAvatarPlaceholder, { backgroundColor: Colors.brownDark }]}>
                    <Text style={screenStyles.modalAvatarInitial}>
                      {(selectedEntry?.displayName || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={screenStyles.modalHeaderInfo}>
                  <Text style={[screenStyles.modalName, { color: Colors.textPrimary }]} numberOfLines={1}>
                    {selectedEntry?.displayName || 'User'}
                  </Text>
                  <View style={screenStyles.modalMetaRow}>
                    <Text style={[screenStyles.modalMetaText, { color: Colors.textMuted }]}>
                      {selectedRank > 0 ? `#${selectedRank}` : '-'}
                    </Text>
                    {selectedLevel && (
                      <Text style={[screenStyles.modalMetaText, { color: Colors.textMuted }]}>
                        {selectedLevel.emoji} {selectedLevel.name}
                      </Text>
                    )}
                  </View>
                </View>

                <InteractivePressable
                  accessibilityRole="button"
                  accessibilityLabel="Tutup profil"
                  onPress={closeProfile}
                  style={screenStyles.modalClose}
                >
                  <Ionicons name="close" size={sw(18)} color={Colors.textMuted} />
                </InteractivePressable>
              </View>

              <View style={screenStyles.modalStatsRow}>
                <View style={screenStyles.modalStat}>
                  <Text style={[screenStyles.modalStatValue, { color: Colors.brownDark }]}>
                    {selectedEntry?.points ?? 0}
                  </Text>
                  <Text style={[screenStyles.modalStatLabel, { color: Colors.textMuted }]}>
                    Poin
                  </Text>
                </View>
                <View style={[screenStyles.modalStatDivider, { backgroundColor: Colors.borderLight }]} />
                <View style={screenStyles.modalStat}>
                  <Text style={[screenStyles.modalStatValue, { color: Colors.brownDark }]}>
                    {selectedEntry?.completedTasks ?? 0}
                  </Text>
                  <Text style={[screenStyles.modalStatLabel, { color: Colors.textMuted }]}>
                    Tugas selesai
                  </Text>
                </View>
                <View style={[screenStyles.modalStatDivider, { backgroundColor: Colors.borderLight }]} />
                <View style={screenStyles.modalStat}>
                  <Text style={[screenStyles.modalStatValue, { color: Colors.brownDark }]}>
                    {selectedEntry?.currentStreak ?? 0}
                  </Text>
                  <Text style={[screenStyles.modalStatLabel, { color: Colors.textMuted }]}>
                    Streak
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Podium card
  podiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  rankCircle: {
    width: sw(28),
    height: sw(28),
    borderRadius: sw(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  avatar: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    marginRight: Spacing.sm,
  },
  avatarPlaceholder: {
    width: sw(38),
    height: sw(38),
    borderRadius: sw(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  entryLevel: {
    fontSize: FontSize.xxs,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryPoints: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  entryPointsLabel: {
    fontSize: FontSize.xxs,
  },

  // List row
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  listRank: {
    width: sw(24),
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
  listAvatar: {
    width: sw(32),
    height: sw(32),
    borderRadius: sw(16),
    marginHorizontal: Spacing.sm,
  },
  listAvatarPlaceholder: {
    width: sw(32),
    height: sw(32),
    borderRadius: sw(16),
    marginHorizontal: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listAvatarInitial: {
    color: '#FFFFFF',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  listMeta: {
    fontSize: FontSize.xxs,
  },
  listPoints: {
    fontSize: FontSize.md,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: FontSize.xxs,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: sw(28),
  },
});

const makeStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.cream },
    content: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: sw(132),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.lg,
    },
    kicker: {
      fontSize: FontSize.xxs,
      color: Colors.textMuted,
      letterSpacing: 2,
      marginBottom: Spacing.sm,
    },
    title: {
      fontSize: FontSize.xxl,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    monthBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: Colors.dailyCardBg,
      borderWidth: 1,
      borderColor: Colors.dailyCardBorder,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
    },
    monthText: {
      fontSize: FontSize.xs,
      fontWeight: '600',
      color: Colors.textPrimary,
    },
    summaryCard: {
      borderRadius: Radius.md,
      borderWidth: 1,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    sectionHeader: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    emptyBox: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: Colors.borderLight,
      borderRadius: Radius.md,
      padding: Spacing.xl,
      alignItems: 'center',
      marginTop: Spacing.lg,
    },
    emptyTitle: {
      color: Colors.textPrimary,
      fontSize: FontSize.md,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyText: {
      color: Colors.textSecondary,
      fontSize: FontSize.sm,
      marginTop: Spacing.xs,
      lineHeight: sw(20),
      textAlign: 'center',
    },
    errorText: {
      color: Colors.danger,
      fontSize: FontSize.xs,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'center',
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.overlay,
    },
    modalContent: {
      paddingHorizontal: Spacing.xl,
    },
    modalCard: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      padding: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalAvatar: {
      width: sw(56),
      height: sw(56),
      borderRadius: sw(28),
      marginRight: Spacing.md,
    },
    modalAvatarPlaceholder: {
      width: sw(56),
      height: sw(56),
      borderRadius: sw(28),
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    modalAvatarInitial: {
      color: '#FFFFFF',
      fontSize: FontSize.lg,
      fontWeight: '700',
    },
    modalHeaderInfo: {
      flex: 1,
    },
    modalName: {
      fontSize: FontSize.lg,
      fontWeight: '700',
    },
    modalMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    modalMetaText: {
      fontSize: FontSize.xs,
      fontWeight: '600',
    },
    modalClose: {
      padding: Spacing.xs,
      marginLeft: Spacing.sm,
      borderRadius: Radius.full,
    },
    modalStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalStat: {
      flex: 1,
      alignItems: 'center',
    },
    modalStatValue: {
      fontSize: FontSize.xl,
      fontWeight: '800',
    },
    modalStatLabel: {
      fontSize: FontSize.xxs,
      marginTop: 2,
      fontWeight: '600',
    },
    modalStatDivider: {
      width: 1,
      height: sw(32),
      marginHorizontal: Spacing.sm,
    },
  });
