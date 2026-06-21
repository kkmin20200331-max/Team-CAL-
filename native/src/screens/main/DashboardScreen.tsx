import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Animated, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { format, startOfDay, endOfDay } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { Post } from '../../types/Post';
import TodayShiftCard from '../../components/dashboard/TodayShiftCard';
import WeeklyStatsCard from '../../components/dashboard/WeeklyStatsCard';
import SubstituteAlertCard from '../../components/dashboard/SubstituteAlertCard';
import NoticeSection from '../../components/dashboard/NoticeSection';
import { useApp } from '../../contexts/AppContext';
import { getMyShiftListAPI, getWeeklyStatsAPI, getSubstitutePostsAPI, getBoardPostsAPI } from '../../../api/auth';

const DashboardScreen = ({ navigation }: { navigation: any }) => {
  const { userInfo } = useApp();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const [todayShift, setTodayShift] = useState<any | null>(null);
  const [weeklyStats, setWeeklyStats] = useState({ totalHours: 0, expectedSalary: 0 });
  const [substituteCount, setSubstituteCount] = useState(0);
  const [notices, setNotices] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  const fetchData = useCallback(async () => {
    if (!userInfo || !userInfo.id || !userInfo.store_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const boardId = userInfo.board_id || 'default_board_id';

      const [shiftRes, statsRes, subRes, noticeRes] = await Promise.all([
        getMyShiftListAPI(userInfo.id, todayStr, todayStr),
        getWeeklyStatsAPI(userInfo.id, userInfo.store_id),
        getSubstitutePostsAPI(userInfo.store_id),
        getBoardPostsAPI(boardId),
      ]);

      setTodayShift(shiftRes.data.length > 0 ? shiftRes.data[0] : null);
      setWeeklyStats(statsRes.data);
      setSubstituteCount(subRes.data.filter((p: any) => p.requester_id !== userInfo.id).length);
      setNotices(noticeRes.data.filter((p: Post) => p.category === 'NOTICE').slice(0, 5));

    } catch (error) {
      console.error("대시보드 데이터 조회 실패:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userInfo]);

  useFocusEffect(fetchData);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleOpenPost = (post: Post) => {
    navigation.navigate('BoardNavigator', { screen: 'BoardDetail', params: { postId: post.id } });
  };

  const handleNavigateToWeeklyDetail = () => {
    if (!userInfo) return;
    navigation.navigate('WeeklyPayrollDetail', {
      weekStartDate: new Date().toISOString(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Image source={require('../../../assets/img/logo_2.png')} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('QRCheckIn')}>
            <Text style={styles.headerButtonText}>{t('qrCheckIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{t('greeting')}, {userInfo?.name}{t('suffixNim')}! 👋</Text>
          <Text style={styles.greetingSubText}>{userInfo?.store_name || '매장'} | {userInfo?.role === 'ADMIN' ? t('admin') : t('staff')}</Text>
        </View>

        <TodayShiftCard loading={loading} todayShift={todayShift} fadeAnim={fadeAnim} t={t} />
        <WeeklyStatsCard weeklyStats={weeklyStats} onPress={handleNavigateToWeeklyDetail} t={t} />
        <SubstituteAlertCard substituteCount={substituteCount} navigation={navigation} t={t} />
        <NoticeSection posts={notices} handleOpenPost={handleOpenPost} navigation={navigation} t={t} />
      </ScrollView>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.card },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  headerButtonText: { fontSize: 13, fontWeight: '600', color: colors.text },
  notificationButton: { padding: 4, position: 'relative' },
  notificationIcon: { fontSize: 22 },
  contentContainer: { flex: 1, padding: 16 },
  greetingSection: { marginBottom: 20 },
  greetingText: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 4 },
  greetingSubText: { fontSize: 14, color: colors.subText, fontWeight: '500' },
  headerLogo: { width: 120, height: 40 },
});

export default DashboardScreen;
