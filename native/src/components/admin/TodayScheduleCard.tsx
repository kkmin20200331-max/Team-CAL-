import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShiftWithUser {
  time: string;
  user?: { // user가 optional일 수 있음을 명시
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
  colors: any;
};

const TodayScheduleCard = ({ schedule, onPress, colors }: Props) => {
  const styles = getThemedStyles(colors);
  const { t } = useLanguage();

  const renderShiftGroup = (title: string, shifts: ShiftWithUser[]) => (
    <View style={styles.shiftGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.employeeContainer}>
        {shifts.length > 0 ? (
          shifts.map((shift, index) => (
            <View key={index} style={styles.employeeChip}>
              {/* [오류 수정] 옵셔널 체이닝(?.)을 사용하여 안전하게 정보 접근 */}
              <View style={[styles.colorDot, { backgroundColor: shift?.user?.color || '#A1A1AA' }]} />
              <Text style={styles.employeeName}>{shift?.user?.name || t('noEmployee')}</Text>
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
        <Text style={styles.title}>{t('todaySchedule')}</Text>
        <Ionicons name="chevron-forward-outline" size={18} color={colors.subText} />
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