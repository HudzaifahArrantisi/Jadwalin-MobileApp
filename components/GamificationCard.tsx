// ============================================
// Jadwalin App — Gamification Stats Card (Home)
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme, Spacing, FontSize, Radius, sw } from '@/constants/theme';

interface GamificationCardProps {
  monthlyPoints: number;
  currentStreak: number;
  levelName: string;
  levelEmoji: string;
  levelProgress: number;
  userRank: number;
}

export default function GamificationCard({
  monthlyPoints,
  currentStreak,
  levelName,
  levelEmoji,
  levelProgress,
  userRank,
}: GamificationCardProps) {
  const { Colors } = useAppTheme();

  return (
    <Animated.View entering={FadeInDown.delay(80).duration(380)}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: Colors.dailyCardBg,
            borderColor: Colors.dailyCardBorder,
          },
        ]}
      >
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="trophy"
              size={sw(16)}
              color={Colors.brownDark}
            />
            <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
              Jadwalin League
            </Text>
          </View>
          <Text style={[styles.levelBadge, { color: Colors.brownDark }]}>
            {levelEmoji} {levelName}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: Colors.borderLight }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: Colors.brownDark,
                width: `${Math.max(levelProgress * 100, 2)}%`,
              },
            ]}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: Colors.pastelLavender }]}>
              <Ionicons name="star" size={sw(14)} color={Colors.brownDark} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: Colors.textPrimary }]}>
                {monthlyPoints}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>
                Poin
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: Colors.pastelOat }]}>
              <Ionicons name="flame" size={sw(14)} color={Colors.warning} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: Colors.textPrimary }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>
                Streak
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: Colors.borderLight }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: Colors.pastelGreen }]}>
              <Ionicons name="podium" size={sw(14)} color={Colors.success} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: Colors.textPrimary }]}>
                {userRank > 0 ? `#${userRank}` : '-'}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>
                Ranking
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  levelBadge: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  progressTrack: {
    height: sw(4),
    borderRadius: sw(2),
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: sw(2),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  statIconCircle: {
    width: sw(30),
    height: sw(30),
    borderRadius: sw(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: FontSize.xxs,
    fontWeight: '500',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: sw(28),
  },
});
