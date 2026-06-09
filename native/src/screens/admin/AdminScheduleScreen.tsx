import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';

// --- 더미 데이터 ---
const dummyUsers = [
  { id: 'user_1', name: '김민준', color: '#4A90E2' },
  { id: 'user_2', name: '이서연', color: '#50E3C2' },
  { id: 'user_3', name: '박도윤', color: '#F5A623' },
  { id: 'user_4', name: '최지우', color: '#BD10E0' },
  { id: 'user_5', name: '정시우', color: '#9013FE' },
];

const generateDummyShifts = (month: Date) => {
  const monthStr = format(month, 'yyyy-MM');
  const shifts = [
    // Week 1
    { userId: 'user_1', date: `${monthStr}-02`, time: '09-15' },
    { userId: 'user_2', date: `${monthStr}-02`, time: '15-22' },
    { userId: 'user_3', date: `${monthStr}-03`, time: '09-17' },
    { userId: 'user_4', date: `${monthStr}-04`, time: '14-22' },
    { userId: 'user_5', date: `${monthStr}-05`, time: '09-15' },
    { userId: 'user_1', date: `${monthStr}-06`, time: '15-22' },
    { userId: 'user_2', date: `${monthStr}-07`, time: '09-17' },
    // Week 2
    { userId: 'user_3', date: `${monthStr}-09`, time: '09-15' },
    { userId: 'user_4', date: `${monthStr}-09`, time: '15-22' },
    { userId: 'user_5', date: `${monthStr}-10`, time: '09-17' },
    { userId: 'user_1', date: `${monthStr}-11`, time: '14-22' },
    { userId: 'user_2', date: `${monthStr}-12`, time: '09-15' },
    { userId: 'user_3', date: `${monthStr}-13`, time: '15-22' },
    { userId: 'user_4', date: `${monthStr}-14`, time: '09-17' },
    // Week 3
    { userId: 'user_5', date: `${monthStr}-16`, time: '09-15' },
    { userId: 'user_1', date: `${monthStr}-16`, time: '15-22' },
    { userId: 'user_2', date: `${monthStr}-17`, time: '09-17' },
    { userId: 'user_3', date: `${monthStr}-18`, time: '14-22' },
    { userId: 'user_4', date: `${monthStr}-19`, time: '09-15' },
    { userId: 'user_5', date: `${monthStr}-20`, time: '15-22' },
    { userId: 'user_1', date: `${monthStr}-21`, time: '09-17' },
  ];
  // Add more shifts for variety
  shifts.push({ userId: 'user_2', date: `${monthStr}-23`, time: '10-18' });
  shifts.push({ userId: 'user_3', date: `${monthStr}-24`, time: '10-18' });
  shifts.push({ userId: 'user_1', date: `${monthStr}-25`, time: '10-18' });

  return shifts;
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const AdminScheduleScreen = () => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const shiftsByDate = useMemo(() => {
    const shifts = generateDummyShifts(currentMonth);
    const grouped: { [key: string]: any[] } = {};
    shifts.forEach(shift => {
      if (!grouped[shift.date]) {
        grouped[shift.date] = [];
      }
      const user = dummyUsers.find(u => u.id === shift.userId);
      if (user) {
        grouped[shift.date].push({ ...shift, user });
      }
    });
    return grouped;
  }, [currentMonth]);

  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    return Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => addMonths(prev, offset));
  };

  const renderCell = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayShifts = shiftsByDate[dateStr] || [];
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());

    return (
      <View style={[styles.cell, !isCurrentMonth && styles.cellNotInMonth]}>
        <Text style={[styles.dateText, isToday && styles.todayText]}>
          {format(date, 'd')}
        </Text>
        <ScrollView style={styles.shiftsContainer} showsVerticalScrollIndicator={false}>
          {dayShifts.map((shift, index) => (
            <View key={index} style={[styles.shiftBadge, { backgroundColor: shift.user.color }]}>
              <Text style={styles.shiftText} numberOfLines={1}>
                {shift.user.name} {shift.time}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayLabels}>
        {DAY_LABELS.map(day => (
          <Text key={day} style={styles.dayLabel}>{day}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDates.map((date, index) => (
          <View key={index} style={styles.cellWrapper}>
            {renderCell(date)}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  arrow: {
    fontSize: 20,
    color: colors.primary,
  },
  dayLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.subText,
    textAlign: 'center',
    width: '14%',
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: '14.28%',
    height: '20%', // 5 weeks
    padding: 2,
  },
  cell: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  cellNotInMonth: {
    backgroundColor: colors.disabled,
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  todayText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  shiftsContainer: {
    flex: 1,
  },
  shiftBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 3,
  },
  shiftText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default AdminScheduleScreen;