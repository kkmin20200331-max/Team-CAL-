import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format, addMonths, startOfMonth, getDaysInMonth, startOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getAttendanceRecordsAPI } from '../../../api/auth';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const AttendanceRecordScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employeeId, employeeName } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const monthStr = format(currentMonth, 'yyyy-MM');
        // const { data } = await getAttendanceRecordsAPI(employeeId, monthStr);
        // setRecords(data);
        
        // --- Dummy Data for UI Test ---
        await new Promise(resolve => setTimeout(resolve, 500));
        const dummyData = [
          { date: `${monthStr}-02`, checkIn: '08:55', checkOut: '17:05', status: 'ON_TIME' },
          { date: `${monthStr}-03`, checkIn: '09:10', checkOut: '17:00', status: 'LATE' },
          { date: `${monthStr}-04`, checkIn: '09:00', checkOut: '16:30', status: 'EARLY_LEAVE' },
          { date: `${monthStr}-05`, status: 'ABSENT' },
        ];
        setRecords(dummyData);
        // --- End of Dummy Data ---

      } catch (error) {
        console.error("Failed to fetch attendance records:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [currentMonth, employeeId]);

  const recordsByDate = useMemo(() => {
    const grouped: { [key: string]: any } = {};
    records.forEach(record => {
      grouped[record.date] = record;
    });
    return grouped;
  }, [records]);

  const calendarDates = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => addMonths(prev, offset));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'LATE': return styles.lateDot;
      case 'EARLY_LEAVE': return styles.earlyLeaveDot;
      case 'ABSENT': return styles.absentDot;
      default: return styles.onTimeDot;
    }
  };

  const renderCell = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = recordsByDate[dateStr];
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isToday = isSameDay(date, new Date());

    return (
      <View style={[styles.cell, !isCurrentMonth && styles.cellNotInMonth]}>
        <Text style={[styles.dateText, isToday && styles.todayText]}>
          {format(date, 'd')}
        </Text>
        {record && <View style={[styles.statusDot, getStatusStyle(record.status)]} />}
      </View>
    );
  };

  const renderRecordItem = ({ item }: { item: any }) => (
    <View style={styles.recordItem}>
      <Text style={styles.recordDate}>{format(new Date(item.date), 'M/d (eee)')}</Text>
      <View style={styles.recordStatus}>
        <View style={[styles.statusDot, getStatusStyle(item.status)]} />
        <Text style={styles.recordStatusText}>{item.status}</Text>
      </View>
      <Text style={styles.recordTime}>{item.checkIn || '-'} / {item.checkOut || '-'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{employeeName} 님의 출퇴근 기록</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(currentMonth, 'yyyy년 M월', { locale: ko })}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayLabels}>
        {DAY_LABELS.map(day => <Text key={day} style={styles.dayLabel}>{day}</Text>)}
      </View>
      <View style={styles.calendarGrid}>
        {calendarDates.map((date, index) => (
          <View key={index} style={styles.cellWrapper}>{renderCell(date)}</View>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={<Text style={styles.listHeader}>상세 기록</Text>}
          ListEmptyComponent={<Text style={styles.emptyText}>해당 월의 출퇴근 기록이 없습니다.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  arrowButton: { padding: 10 },
  arrowText: { fontSize: 18, color: colors.text, fontWeight: 'bold' },
  monthText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  dayLabels: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
  dayLabel: { fontSize: 14, fontWeight: 'bold', color: colors.subText, textAlign: 'center', width: '14.28%' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, paddingBottom: 4 },
  cellWrapper: { width: '14.28%', aspectRatio: 1, padding: 2 },
  cell: { flex: 1, borderRadius: 4, padding: 4, alignItems: 'center' },
  cellNotInMonth: { opacity: 0.3 },
  dateText: { fontSize: 12, color: colors.text, marginBottom: 4 },
  todayText: { color: colors.primary, fontWeight: 'bold' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  onTimeDot: { backgroundColor: colors.green },
  lateDot: { backgroundColor: colors.yellow },
  earlyLeaveDot: { backgroundColor: colors.orange },
  absentDot: { backgroundColor: colors.red },
  listContainer: { padding: 16 },
  listHeader: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  recordItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, padding: 16, marginBottom: 8 },
  recordDate: { flex: 2, fontSize: 15, color: colors.text },
  recordStatus: { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordStatusText: { fontSize: 15, color: colors.text },
  recordTime: { flex: 3, fontSize: 15, color: colors.subText, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: colors.subText, padding: 20 },
});

export default AttendanceRecordScreen;