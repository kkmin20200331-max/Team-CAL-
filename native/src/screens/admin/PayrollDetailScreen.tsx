import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const PayrollDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employeeId, month } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees, shifts } = useSchedule();

  const payrollDetails = useMemo(() => {
    if (!employees || !shifts) return null;

    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return null;

    const selectedMonth = new Date(month);
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);

    const employeeShiftsInMonth = shifts.filter(shift => 
      shift.userId === employee.id &&
      new Date(shift.date) >= monthStart &&
      new Date(shift.date) <= monthEnd &&
      (shift.status === 'CONFIRMED' || shift.status === 'COMPLETED')
    );

    let totalMinutes = 0;
    if (employee.payType === 'HOURLY') {
      employeeShiftsInMonth.forEach(shift => {
        if (!shift.time || !shift.time.includes(' - ')) return;
        const [startStr, endStr] = shift.time.split(' - ');
        const startTime = parseISO(`2000-01-01T${startStr}:00`);
        const endTime = parseISO(`2000-01-01T${endStr}:00`);
        const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        totalMinutes += diff;
      });
    }

    const totalHours = totalMinutes / 60;
    const totalPay = employee.payType === 'SALARY' 
      ? (employee.payRate || 0)
      : Math.round(totalHours * (employee.payRate || 0));

    return {
      employee,
      shifts: employeeShiftsInMonth,
      totalDays: employeeShiftsInMonth.length,
      totalHours: totalHours.toFixed(1),
      totalPay,
    };
  }, [employeeId, month, employees, shifts]);

  if (!payrollDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>급여 명세서</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.errorText}>직원 정보를 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const { employee, shifts: workHistory, totalDays, totalHours, totalPay } = payrollDetails;

  const renderWorkHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyDate}>{format(new Date(item.date), 'M월 d일 (eee)', { locale: ko })}</Text>
      <Text style={styles.historyTime}>{item.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{format(new Date(month), 'yyyy년 M월 급여 명세서', { locale: ko })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.employeeName}>{employee.name} 님</Text>
          <Text style={styles.totalPayLabel}>정산 급여 (세전)</Text>
          <Text style={styles.totalPayAmount}>{totalPay.toLocaleString()}원</Text>
          
          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>총 근무일</Text>
              <Text style={styles.detailValue}>{totalDays}일</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>총 근무시간</Text>
              <Text style={styles.detailValue}>{employee.payType === 'HOURLY' ? `${totalHours}시간` : 'N/A'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>급여 형태</Text>
              <Text style={styles.detailValue}>{employee.payType === 'HOURLY' ? `시급` : '월급'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>적용 시급/월급</Text>
              <Text style={styles.detailValue}>{(employee.payRate || 0).toLocaleString()}원</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>상세 근무 내역</Text>
          <FlatList
            data={workHistory}
            renderItem={renderWorkHistoryItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={<Text style={styles.emptyHistory}>해당 월의 근무 기록이 없습니다.</Text>}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  errorText: { textAlign: 'center', marginTop: 50, color: colors.subText },
  
  summaryCard: { backgroundColor: colors.card, borderRadius: 16, padding: 24, alignItems: 'center' },
  employeeName: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  totalPayLabel: { fontSize: 14, color: colors.subText },
  totalPayAmount: { fontSize: 36, fontWeight: 'bold', color: colors.text, marginTop: 4, marginBottom: 20 },
  divider: { width: '100%', height: 1, backgroundColor: colors.border, marginBottom: 20 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  detailItem: { width: '48%', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: 13, color: colors.subText, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  
  historySection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12, paddingHorizontal: 8 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 8, marginBottom: 8 },
  historyDate: { fontSize: 15, color: colors.text, fontWeight: '500' },
  historyTime: { fontSize: 15, color: colors.subText },
  emptyHistory: { textAlign: 'center', color: colors.subText, padding: 20 },
});

export default PayrollDetailScreen;