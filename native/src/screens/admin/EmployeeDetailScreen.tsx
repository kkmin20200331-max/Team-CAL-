import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const EmployeeDetailScreen = ({ route, navigation }: { route: any, navigation: any }) => {
  const { employee } = route.params;
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const { shifts, updateEmployeeStatus } = useSchedule();

  const employeeShifts = useMemo(() => {
    return shifts.filter(s => s.userId === employee.id && s.status !== 'OFF');
  }, [shifts, employee.id]);

  const handleStatusChange = () => {
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const statusText = newStatus === 'ACTIVE' ? '활성' : '비활성';
    Alert.alert(
      "상태 변경",
      `${employee.name} 님의 상태를 ${statusText}으로 변경하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        { text: "확인", onPress: () => {
          updateEmployeeStatus(employee.id, newStatus);
          navigation.goBack();
        }}
      ]
    );
  };

  const renderShiftItem = (shift: any) => (
    <View key={shift.id} style={styles.shiftItem}>
      <Text style={styles.shiftDate}>{format(new Date(shift.date), 'M/d (eee)', { locale: ko })}</Text>
      <Text style={styles.shiftTime}>{shift.time}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>직원 상세 정보</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: employee.color || '#A1A1AA' }]}>
            <Text style={styles.avatarText}>{employee.name.substring(0, 1)}</Text>
          </View>
          <Text style={styles.name}>{employee.name}</Text>
          <Text style={styles.role}>{employee.role}</Text>
          <View style={[styles.statusBadge, employee.status === 'ACTIVE' ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{employee.status === 'ACTIVE' ? '활동중' : '비활성'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>연락처</Text>
            <Text style={styles.infoValue}>{employee.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>아이디</Text>
            <Text style={styles.infoValue}>{employee.username}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근태 관리</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AttendanceRecord', { employeeId: employee.id, employeeName: employee.name })}>
            <Text style={styles.menuItemText}>📅 출퇴근 기록 보기</Text>
            <Text style={styles.arrow}>〉</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근무 기록 ({employeeShifts.length}건)</Text>
          {employeeShifts.length > 0 ? (
            employeeShifts.slice(0, 5).map(renderShiftItem)
          ) : (
            <Text style={styles.noShiftsText}>예정된 근무가 없습니다.</Text>
          )}
        </View>

        <TouchableOpacity style={styles.statusButton} onPress={handleStatusChange}>
          <Text style={styles.statusButtonText}>
            {employee.status === 'ACTIVE' ? '직원 비활성화' : '직원 활성화'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { fontSize: 24, color: colors.text, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 16 },
  profileSection: { alignItems: 'center', paddingVertical: 20, backgroundColor: colors.card, borderRadius: 12, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: 'white', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  role: { fontSize: 16, color: colors.subText, marginTop: 4 },
  statusBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginTop: 12 },
  activeBadge: { backgroundColor: colors.greenLight },
  inactiveBadge: { backgroundColor: colors.gray },
  statusText: { fontSize: 12, fontWeight: 'bold', color: colors.green },
  section: { backgroundColor: colors.card, borderRadius: 12, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { fontSize: 15, color: colors.subText },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  shiftItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  shiftDate: { fontSize: 15, color: colors.text },
  shiftTime: { fontSize: 15, color: colors.subText },
  noShiftsText: { color: colors.subText, textAlign: 'center', paddingVertical: 10 },
  statusButton: { backgroundColor: colors.redLight, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  statusButtonText: { color: colors.red, fontSize: 16, fontWeight: 'bold' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  menuItemText: { fontSize: 16, color: colors.text },
  arrow: { fontSize: 20, color: colors.subText },
});

export default EmployeeDetailScreen;