import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getPayrollAPI, getStaffListAPI } from '../../../api/auth';
import { useFocusEffect } from '@react-navigation/native';

const PayrollScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { userInfo } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [payrollData, setPayrollData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrollData = async (month: Date) => {
    if (!userInfo || !userInfo.store_id) return;
    setLoading(true);
    try {
      // 1. 먼저 급여를 계산할 모든 직원을 가져옵니다.
      const staffRes = await getStaffListAPI(userInfo.store_id);
      const employees = staffRes.data;

      const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

      // 2. 각 직원에 대해 병렬로 급여 API를 호출합니다.
      const payrollPromises = employees.map((employee: any) => 
        getPayrollAPI(employee.id, userInfo.store_id, startDate, endDate)
          .then(res => ({ ...employee, payroll: res.data }))
          .catch(err => {
            console.error(`${employee.name} 급여 계산 실패:`, err);
            return { ...employee, payroll: null }; // 실패 시 null 처리
          })
      );
      
      const results = await Promise.all(payrollPromises);
      setPayrollData(results);

    } catch (error) {
      console.error("급여 데이터 조회 실패:", error);
      Alert.alert("오류", "급여 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPayrollData(selectedMonth);
    }, [userInfo, selectedMonth])
  );

  const changeMonth = (offset: number) => {
    setSelectedMonth(prev => addMonths(prev, offset));
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
        <Text style={styles.employeeRole}>{item.nickname}</Text>
      </View>
      {item.payroll ? (
        <View style={styles.payrollInfo}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>총 근무시간</Text>
            <Text style={styles.infoValue}>{item.payroll.total_hours?.toFixed(1) || 'N/A'} 시간</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>예상 급여 (세전)</Text>
            <Text style={[styles.infoValue, styles.totalPay]}>{item.payroll.total_pay?.toLocaleString() || 0} 원</Text>
          </View>
        </View>
      ) : (
        <View style={styles.payrollInfo}>
          <Text style={styles.errorText}>계산 실패</Text>
        </View>
      )}
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

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={colors.primary} />
      ) : (
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
          ListEmptyComponent={
            <View style={{alignItems: 'center', marginTop: 50}}>
              <Text style={{color: colors.subText}}>활동중인 직원이 없습니다.</Text>
            </View>
          }
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
  errorText: { color: colors.red, fontStyle: 'italic' },
});

export default PayrollScreen;
