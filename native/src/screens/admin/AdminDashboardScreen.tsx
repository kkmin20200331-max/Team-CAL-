import { useIsFocused } from '@react-navigation/native';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStoreShiftsAPI, getStoreStaffAPI, getSubstitutePostsAPI } from '../../../api/auth';
import TodayScheduleCard from '../../components/admin/TodayScheduleCard';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const colorPalette = ['#4A90E2', '#50E3C2', '#F5A623', '#BD10E0', '#9013FE', '#FF7A00', '#00C4FF'];

const getTimePart = (value?: string) => {
  if (!value) return '';
  let time = value;
  if (value.includes('T')) {
    time = value.split('T')[1];
  } else if (value.includes(' ')) {
    time = value.split(' ')[1];
  }
  return time ? time.slice(0, 5) : '';
};

const normalizeShift = (shift: any) => {
  const startRaw = shift.start_time || shift.startTime || shift.start_at || '';
  const endRaw = shift.end_time || shift.endTime || shift.end_at || '';
  const start = getTimePart(startRaw);
  const end = getTimePart(endRaw);
  return {
    ...shift,
    id: shift.id,
    userId: shift.user_id || shift.userId,
    date: shift.work_date || shift.date,
    time: shift.time || (start && end ? `${start}-${end}` : ''),
    status: shift.status || 'CONFIRMED',
    reason: shift.reason || '',
  };
};

const AdminDashboardScreen = ({ navigation }: { navigation: any }) => {
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors);
  const isFocused = useIsFocused();
  const { userInfo, setActiveBranch } = useApp();
  const { t } = useLanguage();

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
        const [shiftResponse, staffResponse, subResponse] = await Promise.all([
          getStoreShiftsAPI(storeId, today, today),
          getStoreStaffAPI(storeId),
          getSubstitutePostsAPI(storeId).catch(() => ({ data: [] })),
        ]);

        if (!alive) return;

        const staff = Array.isArray(staffResponse.data) ? staffResponse.data : [];
        const staffWithColor = staff.map((member: any, index: number) => ({
          ...member,
          id: member.id || member.user_id,
          name: member.name || member.username || t('staff'),
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
                name: user?.name || shift.user_name || t('staff'),
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
        const subPosts = Array.isArray(subResponse.data) ? subResponse.data : [];
        const activeSubCount = subPosts.filter(
          (p: any) => {
            const st = (p.status || '').toLowerCase();
            return st === 'open' || st === 'pending';
          }
        ).length;

        setCurrentlyWorking(workingNowCount);
        // 선민 수정 (2026-07-06): 당일 근무뿐만 아니라 매장의 전체 활성화된 대타 요청 건수(pending, open)를 카운트하도록 개선
        setSubstituteRequests(activeSubCount);
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
    { title: t('employeeManagement'), icon: 'people-outline', screen: 'EmployeeManagement' },
    { title: t('monthlySchedule'), icon: 'calendar-outline', screen: 'AdminSchedule' },
    { title: t('payroll'), icon: 'cash-outline', screen: 'Payroll' },
    { title: t('internalBoard'), icon: 'document-text-outline', screen: 'BoardNavigator' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('adminDashboard')}</Text>
          <TouchableOpacity style={styles.branchSelector} onPress={() => setBranchModalVisible(true)}>
            <View style={styles.branchSelectorContent}>
              <Text style={styles.storeName}>
                {activeBranch ? `${activeBranch.brandName} ${activeBranch.branchName}` : t('selectBranch')}
              </Text>
              <Ionicons name="chevron-down-outline" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <TouchableOpacity style={styles.summaryBox} onPress={handleNavigateToDailySchedule}>
            {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.summaryValue}>{currentlyWorking}{t('peopleUnit')}</Text>}
            <Text style={styles.summaryLabel}>{t('currentlyWorking')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.summaryBox} onPress={() => navigation.navigate('SubstituteManagement')}>
            {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.summaryValue}>{substituteRequests}{t('casesUnit')}</Text>}
            <Text style={styles.summaryLabel}>{t('substituteRequestsLabel')}</Text>
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
              <Ionicons name={item.icon as any} size={28} color={colors.primary} style={styles.cardIcon} />
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
            <Text style={styles.modalTitle}>{t('selectBranch')}</Text>
            {userInfo?.branches?.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[styles.branchItem, branch.id === activeBranch?.id && styles.branchItemActive]}
                onPress={() => {
                  setActiveBranch(branch.id);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={[styles.branchModalText, branch.id === activeBranch?.id && styles.branchTextActive]}>
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

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContainer: { padding: 16 },
  header: { marginBottom: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  branchSelector: { marginTop: 6 },
  branchSelectorContent: { flexDirection: 'row', alignItems: 'center' },
  storeName: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryBox: { alignItems: 'center', backgroundColor: colors.card, padding: 20, borderRadius: 16, width: '48%', minHeight: 96, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  summaryValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  summaryLabel: { fontSize: 13, color: colors.subText, marginTop: 8, fontWeight: '500' },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', height: 120, backgroundColor: colors.card, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, padding: 16, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardIcon: { marginBottom: 8 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 30, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 20 },
  branchItem: { padding: 16, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  branchItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  branchModalText: { fontSize: 16, color: colors.text },
  branchTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  addBranchButton: { padding: 16, borderRadius: 8, backgroundColor: colors.primaryLight, alignItems: 'center', marginTop: 10 },
  addBranchButtonText: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  closeButton: { marginTop: 20, alignItems: 'center' },
  closeButtonText: { fontSize: 16, color: colors.subText },
});

export default AdminDashboardScreen;
