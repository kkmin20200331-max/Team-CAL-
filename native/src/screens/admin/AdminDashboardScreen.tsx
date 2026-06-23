import { useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStoreShiftsAPI, getStoreStaffAPI } from '../../../api/auth';
import TodayScheduleCard from '../../components/admin/TodayScheduleCard';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';

const colorPalette = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE', '#FF7A00', '#00C4FF'];

const normalizeShift = (shift: any) => {
  const start = shift.start_time || shift.startTime || '';
  const end = shift.end_time || shift.endTime || '';
  return {
    ...shift,
    id: shift.id,
    userId: shift.user_id || shift.userId,
    date: shift.work_date || shift.date,
    time: shift.time || (start && end ? `${start.slice(0, 5)}-${end.slice(0, 5)}` : ''),
    status: shift.status || 'CONFIRMED',
    reason: shift.reason || '',
  };
};

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);
  const isFocused = useIsFocused();
  const { userInfo, setActiveBranch } = useApp();

  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [substituteRequests, setSubstituteRequests] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState<{
    morning: any[];
    afternoon: any[];
    closing: any[];
  }>({ morning: [], afternoon: [], closing: [] });
  const [isBranchModalVisible, setBranchModalVisible] = useState(false);

  const activeBranch = useMemo(() => (
    userInfo?.branches?.find((branch) => branch.id === userInfo.activeBranchId)
  ), [userInfo]);

  useEffect(() => {
    if (!isFocused || !storeId) return;

    let alive = true;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const [shiftResponse, staffResponse] = await Promise.all([
          getStoreShiftsAPI(storeId, today, today),
          getStoreStaffAPI(storeId),
        ]);

        if (!alive) return;

        const staff = Array.isArray(staffResponse.data) ? staffResponse.data : [];
        const staffWithColor = staff.map((member: any, index: number) => ({
          ...member,
          id: member.id || member.user_id,
          name: member.name || member.username || '직원',
          color: colorPalette[index % colorPalette.length],
        }));
        const staffMap = new Map(staffWithColor.map((member: any) => [member.id, member]));

        const processed = (Array.isArray(shiftResponse.data) ? shiftResponse.data : [])
          .map(normalizeShift)
          .filter((shift: any) => shift.status !== 'OFF')
          .map((shift: any) => {
            const user = staffMap.get(shift.userId);
            return {
              ...shift,
              user: {
                name: user?.name || shift.user_name || '직원',
                color: user?.color || '#A1A1AA',
              },
            };
          });

        setEmployees(staffWithColor);
        setTodayShifts(processed);

        const grouped = { morning: [] as any[], afternoon: [] as any[], closing: [] as any[] };
        processed.forEach((shift: any) => {
          const startTime = shift.time?.split('-')[0]?.trim();
          const startHour = Number(startTime?.split(':')[0]);
          if (Number.isNaN(startHour)) return;
          if (startHour < 12) grouped.morning.push(shift);
          else if (startHour < 18) grouped.afternoon.push(shift);
          else grouped.closing.push(shift);
        });
        setTodaySchedule(grouped);

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const workingNowCount = processed.filter((shift: any) => {
          const [startStr, endStr] = shift.time.split('-');
          if (!startStr || !endStr) return false;
          const [startH, startM] = startStr.trim().split(':').map(Number);
          const [endH, endM] = endStr.trim().split(':').map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          return currentMinutes >= startMinutes && currentMinutes < endMinutes;
        }).length;
        setCurrentlyWorking(workingNowCount);
        setSubstituteRequests(processed.filter((shift: any) => shift.status === 'SUBSTITUTE_REQ').length);
      } catch (error) {
        console.error('관리자 대시보드 로드 오류:', error);
        if (alive) {
          setEmployees([]);
          setTodayShifts([]);
          setTodaySchedule({ morning: [], afternoon: [], closing: [] });
          setCurrentlyWorking(0);
          setSubstituteRequests(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      alive = false;
    };
  }, [isFocused, storeId]);

  const handleNavigateToDailySchedule = () => {
    navigation.navigate('AdminDailySchedule', {
      date: format(new Date(), 'yyyy-MM-dd'),
      shifts: todayShifts,
      employees,
    });
  };

  const menuItems = [
    { title: '직원 관리', icon: '👥', screen: 'EmployeeManagement' },
    { title: '월간 근무표', icon: '📅', screen: 'AdminSchedule' },
    { title: '급여 정산', icon: '💰', screen: 'Payroll' },
    { title: '사내 게시판', icon: '📋', screen: 'BoardNavigator' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관리자 대시보드</Text>
          <TouchableOpacity style={styles.branchSelector} onPress={() => setBranchModalVisible(true)}>
            <Text style={styles.storeName}>
              {activeBranch ? `${activeBranch.brandName} ${activeBranch.branchName}` : '지점 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <TouchableOpacity style={styles.summaryBox} onPress={handleNavigateToDailySchedule}>
            {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.summaryValue}>{currentlyWorking}명</Text>}
            <Text style={styles.summaryLabel}>현재 근무중</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryBox} onPress={() => navigation.navigate('SubstituteManagement')}>
            {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.summaryValue}>{substituteRequests}건</Text>}
            <Text style={styles.summaryLabel}>대타 요청</Text>
          </TouchableOpacity>
        </View>

        <TodayScheduleCard
          schedule={todaySchedule}
          onPress={handleNavigateToDailySchedule}
          colors={colors}
        />

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity key={item.screen} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
              <Text style={styles.cardIcon}>{item.icon}</Text>
              <Text style={styles.cardLabel}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isBranchModalVisible}
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>지점 선택</Text>
            {userInfo?.branches?.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[styles.branchItem, branch.id === activeBranch?.id && styles.branchItemActive]}
                onPress={() => {
                  setActiveBranch(branch.id);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={[styles.branchName, branch.id === activeBranch?.id && styles.branchNameActive]}>
                  {branch.brandName} {branch.branchName}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.addBranchButton}
              onPress={() => {
                setBranchModalVisible(false);
                navigation.navigate('AddBranch');
              }}
            >
              <Text style={styles.addBranchButtonText}>+ 지점 추가</Text>
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
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  summaryBox: { alignItems: 'center', backgroundColor: colors.card, padding: 20, borderRadius: 12, width: '45%', minHeight: 96 },
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
  addBranchButton: { padding: 16, borderRadius: 8, backgroundColor: '#E5E7EB', alignItems: 'center', marginTop: 10 },
  addBranchButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: colors.subText },
});

export default AdminDashboardScreen;
