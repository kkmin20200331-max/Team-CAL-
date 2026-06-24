import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
<<<<<<< HEAD
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
=======
import { Ionicons } from '@expo/vector-icons';
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88

interface ShiftWithUser {
  time: string;
  user?: {
    name: string;
    color: string;
  };
}

interface TodayScheduleProps {
  morning: ShiftWithUser[];
  afternoon: ShiftWithUser[];
  closing: ShiftWithUser[];
}

type Props = {
  schedule: TodayScheduleProps;
  onPress: () => void;
};

const TodayScheduleCard = ({ schedule, onPress }: Props) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors);

  const renderShiftGroup = (title: string, shifts: ShiftWithUser[]) => (
    <View style={styles.shiftGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.employeeContainer}>
        {shifts.length > 0 ? (
          shifts.map((shift, index) => (
            <View key={index} style={styles.employeeChip}>
              <View style={[styles.colorDot, { backgroundColor: shift?.user?.color || colors.subText }]} />
              <Text style={styles.employeeName}>{shift?.user?.name || t('unknown')}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noShiftText}>-</Text>
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
<<<<<<< HEAD
        <Text style={styles.title}>{t('todaySchedule')}</Text>
        <Text style={styles.arrow}>〉</Text>
=======
        <Text style={styles.title}>오늘의 스케줄</Text>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.subText} />
>>>>>>> 5ec2e913c168e6eac4f8c589eca3b390569a4a88
      </View>
      <View style={styles.content}>
        {renderShiftGroup(t('morning'), schedule.morning)}
        <View style={styles.divider} />
        {renderShiftGroup(t('afternoon'), schedule.afternoon)}
        <View style={styles.divider} />
        {renderShiftGroup(t('closing'), schedule.closing)}
      </View>
    </TouchableOpacity>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
<<<<<<< HEAD
  arrow: {
    fontSize: 20,
    color: colors.subText,
  },
=======
  content: {
    gap: 12,
  },
  shiftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  groupTitle: {
    width: 50,
    fontSize: 14,
    fontWeight: '600',
    color: colors.subText,
    paddingTop: 2,
  },
  employeeContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  employeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  noShiftText: {
    fontSize: 14,
    color: colors.subText,
    paddingLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});

export default TodayScheduleCard;