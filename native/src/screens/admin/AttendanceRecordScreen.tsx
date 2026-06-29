import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format, addMonths, startOfMonth, getDaysInMonth, startOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getAttendanceRecordsAPI } from '../../../api/auth';
import { useApp } from '../../contexts/AppContext';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

const AttendanceRecordScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employeeId, employeeName } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();
  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const monthStr = format(currentMonth, 'yyyy-MM');
        
        // 백엔드 API 호출 활성화
        // 가정: 백엔드는 { date, check_in, check_out, status } 형태의 배열을 반환
        const { data } = await getAttendanceRecordsAPI(employeeId, monthStr, storeId);
        
        // 백엔드 데이터(snake_case)를 프론트엔드(camelCase)에 맞게 변환
        const formattedData = data.map((item: any) => ({
          date: item.date,
          checkIn: item.check_in,
          checkOut: item.check_out,
          status: item.status,
        }));
        setRecords(formattedData);

      } catch (error) {
        console.error("출퇴근 기록 조회 실패:", error);
        // 백엔드 API가 아직 구현되지 않았을 경우를 대비한 에러 메시지
        Alert.alert("오류", "출퇴근 기록을 불러오는 데 실패했습니다. API가 구현되었는지 확인해주세요.");
        setRecords([]); // 에러 발생 시 목록을 비움
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
