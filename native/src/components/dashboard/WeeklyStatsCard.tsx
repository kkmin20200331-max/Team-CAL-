import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  weeklyStats: {
    totalHours: number;
    expectedSalary: number;
  };
  onPress: () => void;
  t: (key: string) => string;
};

const WeeklyStatsCard = ({ weeklyStats, onPress, t }: Props) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const formatNumber = (num: number) => {
    if (num === 0) return '0';
    return num.toLocaleString();
  }

  return (
    <TouchableOpacity style={styles.statsCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.statHalf}>
        <Text style={styles.statValue}>{weeklyStats.totalHours > 0 ? weeklyStats.totalHours.toFixed(1) : '0'}</Text>
        <Text style={styles.statLabel}>{t('weeklyHours')}</Text>
      </View>

      <View style={styles.verticalDivider} />

      <View style={styles.statHalf}>
        <Text style={styles.statValue}>{formatNumber(weeklyStats.expectedSalary)}</Text>
        <Text style={styles.statLabel}>{t('weeklySalary')}</Text>
      </View>
    </TouchableOpacity>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
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
    color: colors.green,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '500',
  },
});

export default WeeklyStatsCard;