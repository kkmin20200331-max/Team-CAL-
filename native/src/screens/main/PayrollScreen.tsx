import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { User } from '../../types/User';
import { Shift } from '../../types/Schedule';
import { format, getMonth, getYear, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const calculatePayroll = (employee: any, allShifts: Shift[], selectedMonth: Date) => {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const employeeShifts = allShifts.filter(shift => 
    shift.userId === employee.id &&
    new Date(shift.date) >= monthStart &&
    new Date(shift.date) <= monthEnd &&
    (shift.status === 'CONFIRMED' || shift.status === 'COMPLETED')
  );

  if (employee.payType === 'SALARY') {
    return {
      totalHours: 'N/A',
      totalPay: employee.payRate,
    };
  }

  let totalMinutes = 0;
  employeeShifts.forEach(shift => {
    if (!shift.time || !shift.time.includes(' - ')) return;
    const [startStr, endStr] = shift.time.split(' - ');
    const startTime = parseISO(`2000-01-01T${startStr}:00`);
    const endTime = parseISO(`2000-01-01T${endStr}:00`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    totalMinutes += diff;
  });

  const totalHours = totalMinutes / 60;
  const totalPay = totalHours * employee.payRate;

  return {
    totalHours: totalHours.toFixed(1),
    totalPay: Math.round(totalPay),
  };
};


const PayrollScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { employees, shifts } = useSchedule();

  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const payrollData = useMemo(() => {
    return employees
      .filter(emp => emp.status === 'ACTIVE')
      .map(employee => {
        const payroll = calculatePayroll(employee, shifts, selectedMonth);
        return {
          ...employee,
          ...payroll,
        };
      });
  }, [employees, shifts, selectedMonth]);

  const changeMonth = (offset: number) => {
    setSelectedMonth(prev => new Date(prev.setMonth(prev.getMonth() + offset)));
  };

  const handleNavigateToDetail = (employeeId: string) => {
    navigation.navigate('PayrollDetail', {
      employeeId,
      month: selectedMonth.toISOString(),
    });
  };

  const renderEmployeePayroll = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleNavigateToDetail(item.id)}>
      <View style={styles.employeeInfo}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.role}</Text>
      </View>
      <View style={styles.payrollInfo}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>총 근무시간</Text>
          <Text style={styles.infoValue}>{item.totalHours} 시간</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>예상 급여 (세전)</Text>
          <Text style={[styles.infoValue, styles.totalPay]}>{item.totalPay.toLocaleString()} 원</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>급여 정산</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{format(selectedMonth, 'yyyy년 M월', { locale: ko })}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrowButton}>
          <Text style={styles.arrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={payrollData}
        renderItem={renderEmployeePayroll}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerCol1}>직원 정보</Text>
            <Text style={styles.headerCol2}>정산 내역</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  arrowButton: { padding: 10 },
  arrowText: { fontSize: 18, color: colors.text, fontWeight: 'bold' },
  monthText: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  listContainer: { padding: 16 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 10 },
  headerCol1: { flex: 1, fontSize: 14, color: colors.subText, fontWeight: '600' },
  headerCol2: { flex: 2, fontSize: 14, color: colors.subText, fontWeight: '600', textAlign: 'right' },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  employeeInfo: { flex: 1 },
  employeeName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  employeeRole: { fontSize: 14, color: colors.subText, marginTop: 4 },
  payrollInfo: { flex: 2, alignItems: 'flex-end' },
  infoBox: { alignItems: 'flex-end', marginBottom: 8 },
  infoLabel: { fontSize: 12, color: colors.subText },
  infoValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 2 },
  totalPay: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
});

export default PayrollScreen;