import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { ko } from 'date-fns/locale';
import { format, addMonths, startOfMonth, getDaysInMonth, startOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';

const dummyUsers = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2' },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2' },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623' },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0' },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE' },
];

const generateDummyShifts = (month: Date) => {
  const shifts = [];
  const daysInMonth = getDaysInMonth(month);
  const monthStr = format(month, 'yyyy-MM');

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(dateStr).getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (day % 2 !== 0) {
        shifts.push({ userId: dummyUsers[day % 5].id, date: dateStr, time: '09:00-17:00' });
        shifts.push({ userId: dummyUsers[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00' });
      }
      else if (day % 4 === 0) {
        shifts.push({ userId: dummyUsers[day % 5].id, date: dateStr, time: '08:00-16:00' });
        shifts.push({ userId: dummyUsers[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00' });
        shifts.push({ userId: dummyUsers[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00' });
      }
    }
    else if (dayOfWeek === 6) {
        shifts.push({ userId: dummyUsers[day % 5].id, date: dateStr, time: '10:00-18:00' });
        shifts.push({ userId: dummyUsers[(day + 1) % 5].id, date: dateStr, time: '12:00-20:00' });
        shifts.push({ userId: dummyUsers[(day + 2) % 5].id, date: dateStr, time: '14:00-22:00' });
    }
  }
  return shifts;
};

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const AdminScheduleScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const shiftsByDate = useMemo(() => {
    const shifts = generateDummyShifts(currentMonth);
    const grouped: { [key: string]: any[] } = {};
    shifts.forEach(shift => {
      const user = dummyUsers.find(u => u.id === shift.userId);
      if (user) {
        if (!grouped[shift.date]) {
          grouped[shift.date] = [];
        }
        grouped[shift.date].push({ ...shift, user });
      }
    });
    return grouped;
  }, [currentMonth]);

  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => addMonths(prev, offset));
  };

  const handleDatePress = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    navigation.navigate('AdminDailySchedule', {
      date: dateStr,
      shifts: shiftsByDate[dateStr] || [],
      employees: dummyUsers,
    });
  };

  const renderCell = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayShifts = shiftsByDate[dateStr] || [];
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());

    return (
      <TouchableOpacity 
        style={[styles.cell, !isCurrentMonth && styles.cellNotInMonth]}
        onPress={() => handleDatePress(date)}
        disabled={!isCurrentMonth}
      >
        <Text style={[styles.dateText, isToday && styles.todayText]}>
          {format(date, 'd')}
        </Text>
        <ScrollView style={styles.shiftsContainer} showsVerticalScrollIndicator={false}>
          {dayShifts.map((shift, index) => (
            <View key={index} style={[styles.shiftBadge, { backgroundColor: shift.user.color }]}>
              <Text style={styles.shiftText} numberOfLines={1}>
                {`${shift.user.name}`}
              </Text>
            </View>
          ))}
        </ScrollView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{width: 40}}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.monthControl}>
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
        <View style={{ width: 40 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 24,
    color: colors.text,
  },
  monthControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 16,
  },
  arrow: {
    fontSize: 20,
    color: colors.text,
  },
  dayLabels: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.subText,
    textAlign: 'center',
    width: '14.28%',
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: '14.28%',
    height: '16.66%',
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