import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type Props = {
  weeklyStats: {
    totalHours: number;
    expectedSalary: number;
  };
  onPress: () => void;
  colors: any;
  isDarkMode: boolean;
  t: (key: string) => string;
};

const WeeklyStatsCard = ({ weeklyStats, onPress, colors, isDarkMode, t }: Props) => {
  const styles = getThemedStyles(colors, isDarkMode);

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    return num.toLocaleString();
  }

  return (
    <TouchableOpacity style={styles.statsCard} onPress={onPress} activeOpacity={0.8}>
      {/* 왼쪽: 이번 주 근무 시간 */}
      <View style={styles.statHalf}>
        <Text style={styles.statValue}>{weeklyStats.totalHours > 0 ? weeklyStats.totalHours.toFixed(1) : '0'}</Text>
        <Text style={styles.statLabel}>{t('weeklyHours')}</Text>
      </View>

      {/* 가운데 구분선 */}
      <View style={styles.verticalDivider} />

      {/* 오른쪽: 이번 주 예상 급여 */}
      <View style={styles.statHalf}>
        <Text style={styles.statValue}>{formatNumber(weeklyStats.expectedSalary)}</Text>
        <Text style={styles.statLabel}>{t('weeklySalary')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
    flexDirection: 'row', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  statHalf: {
    flex: 1, 
    alignItems: 'center', 
  },
  verticalDivider: {
    width: 1, 
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: isDarkMode ? '#34C759' : '#0cbb00',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '500',
  },
});

export default WeeklyStatsCard;