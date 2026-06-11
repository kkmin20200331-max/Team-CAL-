import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format, getDaysInMonth } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../contexts/AppContext';

const dummyEmployees = [
  { id: 'user_1', name: '김민준', role: '매니저', color: '#4A90E2', payType: 'SALARY' as const, payRate: 3000000 },
  { id: 'user_2', name: '이서연', role: '파트타임', color: '#50E3C2', payType: 'HOURLY' as const, payRate: 10000 },
  { id: 'user_3', name: '박도윤', role: '파트타임', color: '#F5A623', payType: 'HOURLY' as const, payRate: 9860 },
  { id: 'user_4', name: '최지우', role: '풀타임', color: '#BD10E0', payType: 'SALARY' as const, payRate: 2500000 },
  { id: 'user_5', name: '정시우', role: '파트타임', color: '#9013FE', payType: 'HOURLY' as const, payRate: 11000 },
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
        shifts.push({ id: `s_${day}_1`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '09:00-17:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_2`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '15:00-23:00', status: 'CONFIRMED', reason: '' });
      } else if (day % 4 === 0) {
        shifts.push({ id: `s_${day}_3`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '08:00-16:00', status: 'CONFIRMED', reason: '' });
        shifts.push({ id: `s_${day}_4`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '12:00-20:00', status: 'SUBSTITUTE_REQ', reason: '병원 진료' });
        shifts.push({ id: `s_${day}_5`, userId: dummyEmployees[(day + 3) % 5].id, date: dateStr, time: '16:00-23:00', status: 'CONFIRMED', reason: '' });
      }
    } else if (dayOfWeek === 6) {
      shifts.push({ id: `s_${day}_6`, userId: dummyEmployees[day % 5].id, date: dateStr, time: '10:00-18:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_7`, userId: dummyEmployees[(day + 1) % 5].id, date: dateStr, time: '12:00-20:00', status: 'CONFIRMED', reason: '' });
      shifts.push({ id: `s_${day}_8`, userId: dummyEmployees[(day + 2) % 5].id, date: dateStr, time: '14:00-22:00', status: 'SUBSTITUTE_REQ', reason: '가족 행사' });
    }
  }
  return shifts;
};

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const isFocused = useIsFocused();

  const { userInfo, setActiveBranch } = useApp();
  const [shifts, setShifts] = useState(generateDummyShifts(new Date()));
  const [employees, setEmployees] = useState(dummyEmployees);

  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [substituteRequests, setSubstituteRequests] = useState(0);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [isBranchModalVisible, setBranchModalVisible] = useState(false);

  const activeBranch = useMemo(() => {
    return userInfo?.branches?.find(b => b.id === userInfo.activeBranchId);
  }, [userInfo]);

  useEffect(() => {
    if (isFocused) {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      const filteredTodayShifts = shifts
        .filter(s => s.date === todayStr)
        .map(s => ({ ...s, user: employees.find(e => e.id === s.userId) }));
      
      setTodayShifts(filteredTodayShifts);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const workingNowCount = filteredTodayShifts.filter(shift => {
        const [startStr, endStr] = shift.time.split('-');
        const [startH, startM] = startStr.split(':').map(Number);
        const [endH, endM] = endStr.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }).length;

      setCurrentlyWorking(workingNowCount);

      const subCount = shifts.filter(s => s.status === 'SUBSTITUTE_REQ').length;
      setSubstituteRequests(subCount);
    }
  }, [isFocused, shifts, employees]);

  const handleNavigateToDailySchedule = () => {
    navigation.navigate('AdminDailySchedule', {
      date: format(new Date(), 'yyyy-MM-dd'),
      shifts: todayShifts,
      employees: employees,
    });
  };

  const menuItems = [
    { title: '직원 관리', icon: '👥', screen: 'EmployeeManagement' },
    { title: '월간 근무표 보기', icon: '📅', screen: 'AdminSchedule' },
    { title: '급여 정산', icon: '💰', screen: 'Payroll' },
    { title: '공지사항 관리', icon: '📢', screen: 'NoticeManagement' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관리자 대시보드</Text>
          <TouchableOpacity style={styles.branchSelector} onPress={() => setBranchModalVisible(true)}>
            <Text style={styles.storeName}>
              {activeBranch?.brandName || '브랜드'} {activeBranch?.branchName || '지점'} ▼
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <TouchableOpacity style={styles.summaryBox} onPress={handleNavigateToDailySchedule}>
            <Text style={styles.summaryValue}>{currentlyWorking}명</Text>
            <Text style={styles.summaryLabel}>현재 근무중</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryBox} onPress={() => navigation.navigate('SubstituteManagement')}>
            <Text style={styles.summaryValue}>{substituteRequests}건</Text>
            <Text style={styles.summaryLabel}>대타 요청</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isBranchModalVisible}
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>지점 선택</Text>
            {userInfo?.branches?.map(branch => (
              <TouchableOpacity
                key={branch.id}
                style={[styles.branchItem, branch.id === activeBranch?.id && styles.branchItemActive]}
                onPress={() => {
                  setActiveBranch(branch.id);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={[styles.branchName, branch.id === activeBranch?.id && styles.branchNameActive]}>{branch.brandName} {branch.branchName}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addBranchButton}>
              <Text style={styles.addBranchButtonText}>+ 새 지점 추가</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setBranchModalVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 16 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  branchSelector: { marginTop: 4 },
  storeName: { fontSize: 18, color: colors.primary, fontWeight: '600' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  summaryBox: { alignItems: 'center', backgroundColor: colors.card, padding: 20, borderRadius: 12, width: '45%' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  summaryLabel: { fontSize: 14, color: colors.subText, marginTop: 8 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 120, backgroundColor: colors.card, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, padding: 16 },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  branchItem: { padding: 16, borderRadius: 8, marginBottom: 10 },
  branchItemActive: { backgroundColor: colors.primary },
  branchName: { fontSize: 18, color: colors.text },
  branchNameActive: { color: '#FFFFFF', fontWeight: 'bold' },
  addBranchButton: { padding: 16, borderRadius: 8, backgroundColor: colors.disabled, alignItems: 'center', marginTop: 10 },
  addBranchButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: colors.subText },
});

export default AdminDashboardScreen;