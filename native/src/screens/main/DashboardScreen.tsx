import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, RefreshControl, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { useIsFocused } from '@react-navigation/native';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { startOfWeek, endOfWeek, parseISO, format } from 'date-fns';
import { ko } from 'date-fns/locale';

import { User } from '../../types/User';
import { Shift } from '../../types/Schedule';
import { Post } from '../../types/Post';

import TodayShiftCard from '../../components/dashboard/TodayShiftCard';
import WeeklyStatsCard from '../../components/dashboard/WeeklyStatsCard';
import SubstituteAlertCard from '../../components/dashboard/SubstituteAlertCard';
import NoticeSection from '../../components/dashboard/NoticeSection';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext'; // 1. useBoard 훅 임포트
import { getMonthlyAttendanceAPI, getMyScheduleAPI, getPayrollAPI, getMyStoreMembershipsAPI } from '../../../api/auth';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const toDateStr = (date: Date) => format(date, 'yyyy-MM-dd');

const getDatePart = (value?: string) => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value.split(' ')[0];
};

const getTimePart = (value?: string) => {
  if (!value) return '';
  const time = value.includes('T') ? value.split('T')[1] : value.split(' ')[1];
  return time ? time.slice(0, 5) : '';
};

const normalizeShiftStatus = (status?: string): Shift['status'] => {
  const upper = (status || '').toUpperCase();
  if (upper === 'COMPLETED') return 'COMPLETED';
  if (upper === 'WORKING' || upper === 'CHECKED_IN' || upper === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (upper === 'SUBSTITUTE_REQ') return 'SUBSTITUTE_REQ';
  if (upper === 'LEAVE_PENDING') return 'LEAVE_PENDING' as any;
  if (upper === 'VACANT') return 'OFF';
  return 'SCHEDULED';
};

const getRealTimeItem = (item: Shift): Shift => {
  if (item.status === 'OFF' || item.status === 'SUBSTITUTE_REQ' || !item.time || !item.time.includes(' - ')) {
    return item;
  }
  const now = new Date();
  const todayStr = toDateStr(now);
  if (item.fullDate < todayStr) return { ...item, status: 'COMPLETED' };
  if (item.fullDate > todayStr) return { ...item, status: 'SCHEDULED' };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startStr, endStr] = item.time.split(' - ');
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let newStatus: Shift['status'] = 'COMPLETED';
  if (currentMinutes < startMinutes) newStatus = 'SCHEDULED';
  else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) newStatus = 'IN_PROGRESS';
  
  return { ...item, status: newStatus };
};

const mapShift = (raw: any, storeName: string): Shift => {
  const fullDate = getDatePart(raw.work_date) || toDateStr(new Date());
  const start = getTimePart(raw.start_at);
  const end = getTimePart(raw.end_at);

  return getRealTimeItem({
    id: raw.id,
    fullDate,
    date: fullDate.slice(8, 10),
    day: format(parseISO(fullDate), 'eee', { locale: ko }),
    time: start && end ? `${start} - ${end}` : '-',
    storeName,
    status: normalizeShiftStatus(raw.status),
    checkInTime: raw.check_in_at ? getTimePart(raw.check_in_at) : null,
    checkOutTime: raw.check_out_at ? getTimePart(raw.check_out_at) : null,
  });
};

const DashboardScreen = ({ navigation }: Props) => {
  const isFocused = useIsFocused();
  const { userInfo } = useApp();
  const { posts, loadPosts } = useBoard(); // 2. BoardContext에서 posts 및 loadPosts 가져오기
  const { t, language } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const getLogoSource = () => {
    switch (language) {
      case 'English':
        return require('../../../assets/img/logo_en_long.png');
      case '日本語':
        return require('../../../assets/img/logo_2.png');
      case '한국어':
      default:
        return require('../../../assets/img/logo_ko_long.png');
    }
  };

  const userName = userInfo?.name || t('defaultUserName');
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  const { unreadCount } = useContext(NotificationContext);

  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ totalHours: 0, expectedSalary: 0 });
  const [fullSchedule, setFullSchedule] = useState<Shift[]>([]);
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
    { id: 'CHECKLIST', label: 'boardTabChecklist' },
  ];

  // 3. BoardContext의 posts를 정렬하여 사용
  const sortedDashboardPosts = [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.date.replace(/\./g, '-')).getTime();
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.date.replace(/\./g, '-')).getTime();
      return bTime - aTime;
  });

  // 4. 네비게이션 파라미터에서 함수 전달 제거
  const handleOpenPost = (post: Post) => {
    navigation.navigate('BoardNavigator', { screen: 'BoardDetail', params: { postId: post.id } });
  };

  const handleAcceptSubstitute = () => {
    Alert.alert(
      t('subReqConfirmTitle'),
      t('subReqConfirmMsg'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('applyBtn'), 
          onPress: () => {
            setIsAlertVisible(false);
            Toast.show({ type: 'success', text1: t('subApplySuccessTitle'), text2: t('subApplySuccessMsg') });
          } 
        }
      ]
    );
  };

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [userInfo]);

  useEffect(() => {
    if (isFocused && userInfo) {
      fetchData();
    }
  }, [isFocused, userInfo]);

  // 5. fetchData에서 게시글 관련 로직 제거
  const fetchData = async () => {
    if (!userInfo?.id || !userInfo.store_id) return;
    
    setLoading(true);

    try {
      // [선민 수정] 대시보드 로드 시 직원의 소속 매장 승인 시급 정보(payRate) 조회하여 연동
      try {
        const membershipRes = await getMyStoreMembershipsAPI(userInfo.id);
        const activeMembership = Array.isArray(membershipRes.data)
          ? membershipRes.data.find((m: any) => m.id === userInfo.store_id)
          : null;
        if (activeMembership && activeMembership.pay_amount) {
          userInfo.payRate = activeMembership.pay_amount;
        }
      } catch (err) {
        console.error('시급 정보 동기화 실패:', err);
      }

      const now = new Date();
      
      // ✅ [추가] 대시보드 로드 시 게시판 목록도 함께 새로고침하여 첫 렌더링에 노출 보장
      try {
        await loadPosts(userInfo.store_id);
      } catch (err) {
        console.error('대시보드 게시글 로드 실패:', err);
      }
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const todayString = toDateStr(now);
      const yearMonth = todayString.slice(0, 7);

      const [shiftRes, payrollRes, attendanceRes] = await Promise.allSettled([
        getMyScheduleAPI(userInfo.id, toDateStr(weekStart), toDateStr(weekEnd)),
        getPayrollAPI(userInfo.id, userInfo.store_id, toDateStr(weekStart), toDateStr(weekEnd)),
        getMonthlyAttendanceAPI(userInfo.id, userInfo.store_id, yearMonth),
      ]);

      const rawShifts = shiftRes.status === 'fulfilled' && Array.isArray(shiftRes.value.data)
        ? shiftRes.value.data
        : [];
      const schedule = rawShifts
        .filter((item: any) => item.status !== 'CANCELLED')
        .map((item: any) => mapShift(item, storeName));

      const attendanceList = attendanceRes.status === 'fulfilled' && Array.isArray(attendanceRes.value.data)
        ? attendanceRes.value.data
        : [];
      const todayAttendance = attendanceList.find((item: any) => getDatePart(item.work_date) === todayString);

      const mergedSchedule = schedule.map((item) => {
        if (item.fullDate !== todayString || !todayAttendance) return item;
        return {
          ...item,
          status: todayAttendance.check_out_at
            ? 'COMPLETED'
            : todayAttendance.check_in_at
              ? 'IN_PROGRESS'
              : item.status,
          checkInTime: getTimePart(todayAttendance.check_in_at) || item.checkInTime,
          checkOutTime: getTimePart(todayAttendance.check_out_at) || item.checkOutTime,
        };
      });

      setFullSchedule(mergedSchedule);

      const payroll = payrollRes.status === 'fulfilled' ? payrollRes.value.data : null;
      const scheduledMinutes = mergedSchedule.reduce((sum, item) => {
        // [선민 수정] 휴무(OFF), 휴무 대기중(LEAVE_PENDING), 대타 요청(SUBSTITUTE_REQ) 상태인 근무는 이번 주 근무 시간에서 제외
        if (item.status === 'OFF' || (item.status as any) === 'LEAVE_PENDING' || item.status === 'SUBSTITUTE_REQ') {
          return sum;
        }
        if (!item.time.includes(' - ')) return sum;
        const [start, end] = item.time.split(' - ');
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        let diff = eH * 60 + eM - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        return sum + diff;
      }, 0);

      setWeeklyStats({
        totalHours: scheduledMinutes / 60,
        expectedSalary: Number(payroll?.totalPay || 0),
      });

      setTodayShift(mergedSchedule.find((item) => item.fullDate === todayString) || null);
    } catch (error) {
      console.error('직원 대시보드 로드 오류:', error);
      Toast.show({
        type: 'error',
        text1: '데이터 로드 실패',
        text2: '근무 정보를 다시 불러오지 못했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotification = () => navigation.navigate('Notifications');
  const handleQRCheckIn = () => navigation.navigate('QRCheckIn');
  const handleNavigateToPayroll = () => {
    navigation.navigate('Payroll', {
      schedule: fullSchedule,
      userInfo: userInfo,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <Image 
          source={getLogoSource()} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.qrButton} onPress={handleQRCheckIn}>
            <Ionicons name="qr-code-outline" size={15} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={styles.qrButtonText}>{t('qrCheckIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2563EB']}
            tintColor={isDarkMode ? '#60A5FA' : '#2563EB'}
          />
        }
      >
        
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{t('greeting')}, {userName}{t('suffixNim')}! 👋</Text>
          <Text style={styles.greetingSubText}>{storeName} | {userInfo?.role === 'ADMIN' ? t('admin') : t('staff')}</Text>
        </View>

        <TodayShiftCard 
          loading={loading}
          todayShift={todayShift}
          fadeAnim={fadeAnim}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
        />

        <WeeklyStatsCard
          weeklyStats={weeklyStats}
          onPress={handleNavigateToPayroll}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
        />

        <SubstituteAlertCard
          isAlertVisible={isAlertVisible}
          navigation={navigation}
          handleAcceptSubstitute={handleAcceptSubstitute}
          setIsAlertVisible={setIsAlertVisible}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
        />

        <NoticeSection
          posts={sortedDashboardPosts} // 6. Prop 이름 변경
          handleOpenPost={handleOpenPost}
          navigation={navigation}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
          CATEGORIES={CATEGORIES}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

// ... styles ...
const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.card,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  qrButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  notificationButton: { padding: 4, position: 'relative' },
  notificationIcon: { fontSize: 22 },
  badge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: colors.card },
  
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  
  greetingSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  greetingSubText: {
    fontSize: 14,
    color: colors.subText,
    fontWeight: '500',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  postModalContent: { width: '85%', maxHeight: '70%', backgroundColor: colors.modalBg, borderRadius: 16, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  postModalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  postModalDate: { fontSize: 13, color: colors.subText, marginBottom: 16 },
  postModalDivider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  postModalBody: { marginBottom: 20 },
  postModalText: { fontSize: 17, color: colors.text, lineHeight: 26 },
  closeModalButton: { backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },

  headerLogo: {
  width: 120,
  height: 40,
},
});

export default DashboardScreen;
