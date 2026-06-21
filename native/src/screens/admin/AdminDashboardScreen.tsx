import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../contexts/AppContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import TodayScheduleCard from '../../components/admin/TodayScheduleCard';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLeaveRequestsAPI } from '../../../api/auth'; // API import

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const styles = getThemedStyles(colors, isDarkMode);
  const isFocused = useIsFocused();

  const { userInfo, setActiveBranch } = useApp();
  const { shifts, employees } = useSchedule(); // TodayScheduleCard는 Context 기반이므로 유지

  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState({ morning: [], afternoon: [], closing: [] });
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [isBranchModalVisible, setBranchModalVisible] = useState(false);

  const activeBranch = useMemo(() => {
    return userInfo?.branches?.find(b => b.id === userInfo.activeBranchId);
  }, [userInfo]);

  useEffect(() => {
    if (!isFocused || !userInfo) return;

    // --- 휴무 신청 건수 API 연동 ---
    const fetchPendingRequests = async () => {
      if (!userInfo.store_id) return;
      try {
        // URL: /api/leave_request?store_id={store_id}
        // DB: LEAVE_REQUESTS 테이블에서 status가 'PENDING'인 요청 조회
        const res = await getLeaveRequestsAPI(userInfo.store_id);
        setPendingRequestCount(res.data.length);
      } catch (error) {
        console.error("휴무 신청 목록 조회 실패:", error);
        setPendingRequestCount(0);
      }
    };
    fetchPendingRequests();
    
    // --- 기존 대시보드 로직 (오늘 근무 현황 등) ---
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    const processedTodayShifts = shifts
      .filter(s => s.date === todayStr && s.status !== 'OFF')
      .map(s => {
        const user = employees.find(e => e.id === s.userId);
        return { ...s, user: { name: user?.name || 'N/A', color: user?.color || '#A1A1AA' } };
      });
    setTodayShifts(processedTodayShifts);

    const scheduleByTime: any = { morning: [], afternoon: [], closing: [] };
    processedTodayShifts.forEach(shift => {
      if (!shift.time || !shift.time.includes(' - ')) return;
      const timeParts = shift.time.split(' - ');
      if (timeParts.length < 2) return;
      const startTime = timeParts[0];
      if (!startTime || !startTime.includes(':')) return;
      const startHourNum = parseInt(startTime.split(':')[0], 10);
      if (isNaN(startHourNum)) return;
      if (startHourNum < 12) scheduleByTime.morning.push(shift);
      else if (startHourNum >= 12 && startHourNum < 18) scheduleByTime.afternoon.push(shift);
      else scheduleByTime.closing.push(shift);
    });
    setTodaySchedule(scheduleByTime);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const workingNowCount = processedTodayShifts.filter(shift => {
      if (!shift.time || !shift.time.includes(' - ')) return false;
      const [startStr, endStr] = shift.time.split(' - ');
      if (!startStr || !endStr || !startStr.includes(':') || !endStr.includes(':')) return false;
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }).length;
    setCurrentlyWorking(workingNowCount);
    
  }, [isFocused, userInfo, shifts, employees]);

  const handleNavigateToDailySchedule = () => {
    navigation.navigate('AdminDailySchedule', {
      date: format(new Date(), 'yyyy-MM-dd'),
      shifts: todayShifts, 
      employees: employees,
    });
  };

  const menuItems = [
    { title: t('employeeManagement'), icon: '👥', screen: 'EmployeeManagement' },
    { title: t('monthlySchedule'), icon: '📅', screen: 'AdminSchedule' },
    { title: t('payroll'), icon: '💰', screen: 'Payroll' },
    { title: t('internalBoard'), icon: '📢', screen: 'BoardNavigator' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('adminDashboard')}</Text>
          <TouchableOpacity style={styles.branchSelector} onPress={() => setBranchModalVisible(true)}>
            <Text style={styles.storeName}>
              {activeBranch?.brandName || t('brand')} {activeBranch?.branchName || t('branch')} ▼
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <TouchableOpacity style={styles.summaryBox} onPress={handleNavigateToDailySchedule}>
            <Text style={styles.summaryValue}>{currentlyWorking}명</Text>
            <Text style={styles.summaryLabel}>{t('currentlyWorking')}</Text>
          </TouchableOpacity>
          {/* "처리할 요청" 카드 클릭 시 휴무 신청 관리 화면으로 이동 */}
          <TouchableOpacity style={styles.summaryBox} onPress={() => navigation.navigate('LeaveRequestManagement')}>
            <Text style={styles.summaryValue}>{pendingRequestCount}건</Text>
            <Text style={styles.summaryLabel}>{t('requestProcessing')}</Text>
          </TouchableOpacity>
        </View>
        
        <TodayScheduleCard 
          schedule={todaySchedule}
          onPress={handleNavigateToDailySchedule}
        />

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
            <Text style={styles.modalTitle}>{t('selectBranch')}</Text>
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
            <TouchableOpacity 
              style={styles.addBranchButton}
              onPress={() => {
                setBranchModalVisible(false);
                navigation.navigate('AddBranch');
              }}
            >
              <Text style={styles.addBranchButtonText}>{t('addNewBranch')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setBranchModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 16 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  branchSelector: { marginTop: 4 },
  storeName: { fontSize: 18, color: colors.text, fontWeight: '600' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  summaryBox: { alignItems: 'center', backgroundColor: colors.card, padding: 20, borderRadius: 12, width: '45%' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.text },
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
  branchNameActive: { color: colors.white, fontWeight: 'bold' },
  addBranchButton: { padding: 16, borderRadius: 8, backgroundColor: isDarkMode ? colors.border : '#E5E7EB', alignItems: 'center', marginTop: 10 },
  addBranchButtonText: { fontSize: 16, color: colors.text, fontWeight: '600' },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: colors.subText },
});

export default AdminDashboardScreen;
