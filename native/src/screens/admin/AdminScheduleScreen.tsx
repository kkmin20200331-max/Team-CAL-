import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import Toast from 'react-native-toast-message';
import { getStoreShiftsAPI, getStoreStaffAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const COLORS = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE', '#00A200'];

const getDatePart = (value?: string) => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
};

const getTimePart = (value?: string) => {
  if (!value) return '';
  const time = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
  return time ? time.slice(0, 5) : value.slice(0, 5);
};

const AdminScheduleScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedule = useCallback(async () => {
    if (!storeId) {
      setEmployees([]);
      setShifts([]);
      return;
    }

    setLoading(true);
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const [staffRes, shiftRes] = await Promise.all([
        getStoreStaffAPI(storeId),
        getStoreShiftsAPI(storeId, startDate, endDate),
      ]);

      setEmployees(Array.isArray(staffRes.data) ? staffRes.data : []);
      setShifts(Array.isArray(shiftRes.data) ? shiftRes.data : []);
    } catch (error) {
      console.error('관리자 근무표 조회 실패:', error);
      Toast.show({
        type: 'error',
        text1: '근무표 조회 실패',
        text2: '백엔드에서 근무표를 불러오지 못했습니다.',
      });
    } finally {
      setLoading(false);
    }
  }, [currentMonth, storeId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedule();
    setRefreshing(false);
  };

  const employeeMap = useMemo(() => {
    const map: Record<string, any> = {};
    employees.forEach((employee, index) => {
      map[employee.id] = {
        ...employee,
        color: COLORS[index % COLORS.length],
      };
    });
    return map;
  }, [employees]);

  const shiftsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    shifts.forEach((shift) => {
      const date = getDatePart(shift.work_date);
      if (!date) return;
      const employee = employeeMap[shift.user_id];
      const start = getTimePart(shift.start_at);
      const end = getTimePart(shift.end_at);
      const item = {
        ...shift,
        date,
        time: start && end ? `${start}-${end}` : '',
        user: {
          id: shift.user_id,
          name: employee?.name || shift.user_id || '미배정',
          color: employee?.color || '#A1A1AA',
        },
      };
      grouped[date] = [...(grouped[date] || []), item];
    });
    return grouped;
  }, [employeeMap, shifts]);

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
      employees,
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
            <View key={`${shift.id || dateStr}-${index}`} style={[styles.shiftBadge, { backgroundColor: shift.user.color }]}>
              <Text style={styles.shiftText} numberOfLines={1}>
                {shift.user.name}
              </Text>
              {!!shift.time && (
                <Text style={styles.shiftTimeText} numberOfLines={1}>
                  {shift.time}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonWrapper}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthControl}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={loadSchedule}>
          <Text style={styles.refreshText}>새로고침</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.dayLabels}>
          {DAY_LABELS.map(day => (
            <Text key={day} style={styles.dayLabel}>{day}</Text>
          ))}
        </View>

        {loading && shifts.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>근무표를 불러오는 중입니다.</Text>
          </View>
        ) : (
          <View style={styles.calendarGrid}>
            {calendarDates.map((date, index) => (
              <View key={index} style={styles.cellWrapper}>
                {renderCell(date)}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButtonWrapper: { width: 64, justifyContent: 'center', alignItems: 'flex-start' },
    refreshText: { color: colors.primary, fontSize: 14, fontWeight: '700', width: 64, textAlign: 'right' },
    monthControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginHorizontal: 12 },
    arrowButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
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
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', minHeight: 620 },
    cellWrapper: { width: '14.28%', height: 104, padding: 2 },
    cell: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
    },
    cellNotInMonth: { backgroundColor: colors.disabled, opacity: 0.45 },
    dateText: { fontSize: 12, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    todayText: { color: colors.primary, fontWeight: 'bold' },
    shiftsContainer: { flex: 1 },
    shiftBadge: {
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 4,
      marginBottom: 3,
    },
    shiftText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
    shiftTimeText: { color: '#FFFFFF', fontSize: 9, opacity: 0.9 },
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { marginTop: 12, color: colors.subText, fontSize: 14, fontWeight: '600' },
  });

export default AdminScheduleScreen;
