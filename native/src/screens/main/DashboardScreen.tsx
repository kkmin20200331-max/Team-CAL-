import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { startOfWeek, endOfWeek, parseISO, format, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Post } from '../../types/Post';
import TodayShiftCard from '../../components/dashboard/TodayShiftCard';
import WeeklyStatsCard from '../../components/dashboard/WeeklyStatsCard';
import SubstituteAlertCard from '../../components/dashboard/SubstituteAlertCard';
import NoticeSection from '../../components/dashboard/NoticeSection';
import { useApp } from '../../contexts/AppContext';
import { useBoard } from '../../contexts/BoardContext';
import { useSchedule } from '../../contexts/ScheduleContext';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
};

const DashboardScreen = ({ navigation }: Props) => {
  const { userInfo } = useApp();
  const { posts } = useBoard();
  const { shifts, employees } = useSchedule();
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const userName = userInfo?.name || t('defaultUserName');
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  const { unreadCount } = useContext(NotificationContext);

  const [todayShift, setTodayShift] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState({ totalHours: 0, expectedSalary: 0 });
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

  const sortedDashboardPosts = [...posts].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
    // 데이터는 Context 변경 시 자동으로 업데이트되므로, 여기서는 로딩 효과만 줌
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    if (userInfo && shifts && employees) {
      setLoading(true);

      const mySchedule = shifts
        .filter(s => s.userId === userInfo.id)
        .map(s => ({
          ...s,
          user: employees.find(e => e.id === s.userId)
        }));

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      let calculatedMinutes = 0;
      mySchedule.forEach(item => {
        const shiftDate = parseISO(item.date);
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
      const shiftForToday = mySchedule.find(item => item.date === todayString);
      
      setTodayShift(shiftForToday || null);

      setLoading(false);
    }
  }, [userInfo, shifts, employees]);

  const handleNotification = () => navigation.navigate('Notifications');
  const handleQRCheckIn = () => navigation.navigate('QRCheckIn');
  
  const handleNavigateToWeeklyDetail = () => {
    if (!userInfo) return;
    navigation.navigate('WeeklyPayrollDetail', {
      weekStartDate: new Date().toISOString(),
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
          onPress={handleNavigateToWeeklyDetail}
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
          posts={sortedDashboardPosts}
          handleOpenPost={handleOpenPost}
          navigation={navigation}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.card },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  qrButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  notificationButton: { padding: 4, position: 'relative' },
  notificationIcon: { fontSize: 22 },
  badge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: colors.card },
  contentContainer: { flex: 1, padding: 16 },
  greetingSection: { marginBottom: 20 },
  greetingText: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  greetingSubText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  headerLogo: { width: 120, height: 40 },
});

export default DashboardScreen;