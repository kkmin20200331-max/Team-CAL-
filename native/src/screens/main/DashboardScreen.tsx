import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, RefreshControl, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { startOfWeek, endOfWeek, parseISO, format, isWithinInterval, subDays, addDays } from 'date-fns';
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

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const generateDummySchedule = (storeName: string, t: (key: string) => string): Shift[] => {
    const now = new Date();
    const schedule: Shift[] = [];
    const statuses: Shift['status'][] = ['COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'SCHEDULED', 'SUBSTITUTE_REQ', 'OFF'];

    for (let i = -3; i <= 3; i++) {
        const date = addDays(now, i);
        const status = statuses[(i + 3) % statuses.length];
        
        if (status === 'OFF') {
            schedule.push({
                id: `shift_${i}`,
                fullDate: format(date, 'yyyy-MM-dd'),
                date: format(date, 'dd'),
                day: format(date, 'eee', { locale: ko }),
                time: t('offDay'),
                storeName: '-',
                status: 'OFF',
                checkInTime: null,
                checkOutTime: null,
            });
        } else {
            schedule.push({
                id: `shift_${i}`,
                fullDate: format(date, 'yyyy-MM-dd'),
                date: format(date, 'dd'),
                day: format(date, 'eee', { locale: ko }),
                time: '14:00 - 22:00', // 8 hours
                storeName,
                status: status,
                checkInTime: status === 'COMPLETED' || status === 'IN_PROGRESS' ? '13:58' : null,
                checkOutTime: status === 'COMPLETED' ? '22:03' : null,
            });
        }
    }
    return schedule;
};

const DashboardScreen = ({ navigation }: Props) => {
  const { userInfo } = useApp();
  const { posts } = useBoard(); // 2. BoardContext에서 posts 상태 가져오기
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

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
  ];

  // 3. BoardContext의 posts를 정렬하여 사용
  const sortedDashboardPosts = [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
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
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  // 5. fetchData에서 게시글 관련 로직 제거
  const fetchData = async () => {
    if (!userInfo) return;
    
    setLoading(true);

    const schedule = generateDummySchedule(storeName, t);
    setFullSchedule(schedule);

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    let calculatedMinutes = 0;
    schedule.forEach(item => {
      const shiftDate = parseISO(item.fullDate);
      if (isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })) {
        if (item.status !== 'OFF' && item.status !== 'SUBSTITUTE_REQ' && item.time && item.time.includes(' - ')) {
          const [start, end] = item.time.split(' - ');
          const [sH, sM] = start.split(':').map(Number);
          const [eH, eM] = end.split(':').map(Number);
          
          let diff = (eH * 60 + eM) - (sH * 60 + sM);
          if (diff < 0) diff += 24 * 60;
          calculatedMinutes += diff;
        }
      }
    });

    const calculatedHours = calculatedMinutes / 60;
    const stats = {
      totalHours: calculatedHours,
      expectedSalary: calculatedHours * (userInfo.payRate || 9860)
    };
    setWeeklyStats(stats);

    const todayString = format(now, 'yyyy-MM-dd');
    const shiftForToday = schedule.find((item: any) => item.fullDate === todayString);
    
    if (shiftForToday && shiftForToday.status === 'IN_PROGRESS') {
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startStr, endStr] = shiftForToday.time.split(' - ');
        const [startH, startM] = startStr.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        if (currentMinutes < startMinutes) {
            shiftForToday.status = 'SCHEDULED';
        }
    }
    setTodayShift(shiftForToday ? { ...shiftForToday } : null);

    setLoading(false);
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
          source={require('../../../assets/img/logo_2.png')} 
          style={styles.headerLogo} 
          resizeMode="contain" 
        />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.qrButton} onPress={handleQRCheckIn}>
            <Text style={styles.qrButtonText}>{t('qrCheckIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
            <Text style={styles.notificationIcon}>🔔</Text>
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