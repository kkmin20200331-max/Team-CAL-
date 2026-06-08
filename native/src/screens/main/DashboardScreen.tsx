import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert, RefreshControl, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { getMyScheduleAPI } from '../../../api/auth';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

// ✅ [추가] 타입(설계도) 임포트
import { User } from '../../types/User';
import { Shift } from '../../types/Schedule';
import { Post } from '../../types/Post';

// ✅ [추가] 분리된 컴포넌트 임포트
import TodayShiftCard from '../../components/dashboard/TodayShiftCard';
import WeeklyStatsCard from '../../components/dashboard/WeeklyStatsCard';
import SubstituteAlertCard from '../../components/dashboard/SubstituteAlertCard';
import NoticeSection from '../../components/dashboard/NoticeSection';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
  userInfo?: User | null; // ✅ [수정] any 대신 User 타입 적용
};

const DashboardScreen = ({ navigation, setIsLoggedIn, userInfo }: Props) => {
  
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const userName = userInfo?.name || t('defaultUserName');
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  const { unreadCount } = useContext(NotificationContext);

  // ✅ [수정] any 대신 Shift 타입 적용
  const [todayShift, setTodayShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
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

  // ✅ [수정] any 대신 Post 타입 적용
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  const dummyPosts: Post[] = [
    { id: '1', category: 'MENU', title: 'boardDummy1Title', date: '2026.08.25', content: 'boardDummy1Content', badge: 'badgeNew' },
    { id: '2', category: 'NOTICE', title: 'boardDummy2Title', date: '2026.05.28', content: 'boardDummy2Content', badge: null },
    { id: '3', category: 'NOTICE', title: 'boardDummy3Title', date: '2026.09.20', content: 'boardDummy3Content', badge: 'badgeImportant' },
  ];

  const sortedDummyPosts = [...dummyPosts].sort((a, b) => b.date.localeCompare(a.date));

  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    setPostModalVisible(true);
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
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    fetchTodaySchedule();
  }, [userInfo]);

  const fetchTodaySchedule = async () => {
    if (!userInfo) return;
    
    setLoading(true);

    const dummySchedule: Shift[] = [
      { id: '0', fullDate: '2026-05-31', date: '31', day: '일', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED', checkInTime: '13:58', checkOutTime: '22:03' },
      { id: '1', fullDate: '2026-06-01', date: '01', day: '월', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED', checkInTime: '14:05 (지각)', checkOutTime: '22:01' },
      { id: '2', fullDate: '2026-06-02', date: '02', day: '화', time: '14:00 - 22:00', storeName: storeName, status: 'IN_PROGRESS', checkInTime: '13:59', checkOutTime: null },
      { id: '3', fullDate: '2026-06-03', date: '03', day: '수', time: t('offDay'), storeName: '-', status: 'OFF', checkInTime: null, checkOutTime: null },
      { id: '4', fullDate: '2026-06-05', date: '05', day: '목', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED', checkInTime: null, checkOutTime: null },
      { id: '5', fullDate: '2026-06-06', date: '06', day: '금', time: '14:00 - 22:00', storeName: storeName, status: 'SUBSTITUTE_REQ', checkInTime: null, checkOutTime: null },
    ];
    
    let calculatedMinutes = 0;
    dummySchedule.forEach(item => {
      if (item.status !== 'OFF' && item.time && item.time.includes(' - ')) {
        const [start, end] = item.time.split(' - ');
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        calculatedMinutes += diff;
      }
    });

    const calculatedHours = Math.round((calculatedMinutes / 60) * 10) / 10;
    const dummyStats = {
      totalHours: calculatedHours,
      expectedSalary: calculatedHours * 10320
    };

    try {
      const storeId = userInfo.store_id || userInfo.brandName || 'default_store';
      const response = await getMyScheduleAPI(userInfo.username, storeId);
      
    } catch (error) {
      console.log("오늘의 근무 불러오기 에러 (더미 데이터 사용 중):", error);
    } finally {
      const scheduleList = dummySchedule;
      const shift = scheduleList.find((item: any) => item.id === '2');
      
      if (shift) {
        if (shift.status !== 'OFF' && shift.status !== 'SUBSTITUTE_REQ' && shift.time && shift.time.includes(' - ')) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          
          const [startStr, endStr] = shift.time.split(' - ');
          const [startH, startM] = startStr.split(':').map(Number);
          const [endH, endM] = endStr.split(':').map(Number);
          
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          
          if (currentMinutes < startMinutes) shift.status = 'SCHEDULED';
          else if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) shift.status = 'IN_PROGRESS';
          else shift.status = 'COMPLETED';
        }
      }
      
      setTodayShift(shift ? { ...shift } : null);
      setWeeklyStats(dummyStats);
      setLoading(false);
    }
  };

  const handleNotification = () => navigation.navigate('Notifications');
  const handleQRCheckIn = () => navigation.navigate('QRCheckIn');

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
          userInfo={userInfo}
          navigation={navigation}
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
          sortedDummyPosts={sortedDummyPosts}
          handleOpenPost={handleOpenPost}
          navigation={navigation}
          colors={colors}
          isDarkMode={isDarkMode}
          t={t}
          CATEGORIES={CATEGORIES}
        />

      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postModalContent}>
            {selectedPost && (
              <>
                <Text style={styles.postModalTitle}>{t(selectedPost.title)}</Text>
                <Text style={styles.postModalDate}>{selectedPost.date}</Text>
                <View style={styles.postModalDivider} />
                <ScrollView style={styles.postModalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postModalText}>{t(selectedPost.content)}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeModalButton} onPress={() => setPostModalVisible(false)}>
                  <Text style={styles.closeModalButtonText}>{t('close')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

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
