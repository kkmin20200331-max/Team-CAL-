import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { useIsFocused } from '@react-navigation/native';
import { useApp } from '../../contexts/AppContext';
import { useSchedule } from '../../contexts/ScheduleContext';
import TodayScheduleCard from '../../components/admin/TodayScheduleCard';

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);
  const isFocused = useIsFocused();

  const { userInfo, setActiveBranch } = useApp();
  const { shifts, employees } = useSchedule();

  const [currentlyWorking, setCurrentlyWorking] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [todaySchedule, setTodaySchedule] = useState({ morning: [], afternoon: [], closing: [] });
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [isBranchModalVisible, setBranchModalVisible] = useState(false);

  const activeBranch = useMemo(() => {
    return userInfo?.branches?.find(b => b.id === userInfo.activeBranchId);
  }, [userInfo]);

  useEffect(() => {
    if (isFocused) {
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
        const startTime = shift.time.split(' - ')[0];
        const startHourNum = parseInt(startTime.split(':')[0], 10);

        if (startHourNum < 12) {
          scheduleByTime.morning.push(shift);
        } else if (startHourNum >= 12 && startHourNum < 18) {
          scheduleByTime.afternoon.push(shift);
        } else {
          scheduleByTime.closing.push(shift);
        }
      });
      setTodaySchedule(scheduleByTime);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const workingNowCount = processedTodayShifts.filter(shift => {
        if (!shift.time || !shift.time.includes(' - ')) return false;
        const timeParts = shift.time.split(' - ');
        if (timeParts.length < 2) return false;
        const [startStr, endStr] = timeParts;
        const startParts = startStr.split(':');
        const endParts = endStr.split(':');
        if (startParts.length < 2 || endParts.length < 2) return false;
        const [startH, startM] = startParts.map(Number);
        const [endH, endM] = endParts.map(Number);
        if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
      }).length;
      setCurrentlyWorking(workingNowCount);

      const requestCount = shifts.filter(s => s.status === 'SUBSTITUTE_REQ' || s.status === 'LEAVE_REQ').length;
      setPendingRequestCount(requestCount);
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
    { title: '사내 게시판', icon: '📢', screen: 'BoardNavigator' },
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
            <Text style={styles.summaryValue}>{pendingRequestCount}건</Text>
            <Text style={styles.summaryLabel}>요청 처리</Text>
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
            <TouchableOpacity 
              style={styles.addBranchButton}
              onPress={() => {
                setBranchModalVisible(false);
                navigation.navigate('AddBranch');
              }}
            >
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