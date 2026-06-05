import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Alert, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { getMyScheduleAPI } from '../../../api/auth';
import { NotificationContext } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext'; // ✅ [추가] 테마 Context 불러오기
import Toast from 'react-native-toast-message';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
  userInfo?: any; // App.tsx에서 전달받은 유저 정보
};

const DashboardScreen = ({ navigation, setIsLoggedIn, userInfo }: Props) => {
  
  // ✅ 전역 언어 설정 가져오기 (가장 먼저 선언해야 아래에서 에러가 발생하지 않습니다!)
  const { t } = useLanguage();

  // ✅ 테마 색상 상태 가져오기 및 스타일 객체 생성
  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  // 백엔드에서 전달받은 정보 파싱 (없을 경우 기본값)
  const userName = userInfo?.name || t('defaultUserName');
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  // ✅ 전역 상태에서 안 읽은 알림 개수 가져오기
  const { unreadCount } = useContext(NotificationContext);

  // ✅ 오늘의 근무 상태 관리
  const [todayShift, setTodayShift] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // ✅ 이번 주 통계 상태 관리
  const [weeklyStats, setWeeklyStats] = useState({ totalHours: 0, expectedSalary: 0 });
  // ✅ 대타 요청 알림 카드 표시 여부 상태
  const [isAlertVisible, setIsAlertVisible] = useState(true);

  // ✅ 스켈레톤 UI (뼈대) 깜빡임 애니메이션 상태
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  // ✅ 게시판 데이터 및 모달 상태 관리
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // ✅ 카테고리 탭 목록 정의 (게시판과 동일하게 매핑용으로 추가)
  const CATEGORIES = [
    { id: 'ALL', label: 'boardTabAll' },
    { id: 'NOTICE', label: 'boardTabNotice' },
    { id: 'MENU', label: 'boardTabMenu' },
    { id: 'EVENT', label: 'boardTabEvent' },
    { id: 'MANUAL', label: 'boardTabManual' },
    { id: 'LOST', label: 'boardTabLost' },
  ];

  const dummyPosts = [
    { id: '1', category: 'MENU', title: 'boardDummy1Title', date: '2026.08.25', content: 'boardDummy1Content', badge: 'badgeNew' },
    { id: '2', category: 'NOTICE', title: 'boardDummy2Title', date: '2026.05.28', content: 'boardDummy2Content', badge: null },
    { id: '3', category: 'NOTICE', title: 'boardDummy3Title', date: '2026.09.20', content: 'boardDummy3Content', badge: 'badgeImportant' },
  ];

  // ✅ 최신 날짜 순(내림차순)으로 정렬
  const sortedDummyPosts = [...dummyPosts].sort((a, b) => b.date.localeCompare(a.date));

  const handleOpenPost = (post: any) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

  // ✅ 대타 지원 버튼 클릭 시 팝업 및 처리 핸들러
  // 백엔드 API 연동이 완료되면 이 함수 내에서 실제로 대타 지원 요청을 보내는 로직(axios.post)으로 교체하면 됩니다.
  const handleAcceptSubstitute = () => {
    Alert.alert(
      t('subReqConfirmTitle'),
      t('subReqConfirmMsg'),
      [
        { text: t('cancel'), style: "cancel" },
        { 
          text: t('applyBtn'), 
          onPress: () => {
            setIsAlertVisible(false); // 카드 숨기기
            Toast.show({ type: 'success', text1: t('subApplySuccessTitle'), text2: t('subApplySuccessMsg') });
          } 
        }
      ]
    );
  };

  // ✅ 당겨서 새로고침 상태 및 핸들러 추가
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // 💡 실제 백엔드 연동 시 여기에 fetchTodaySchedule() 같은 함수를 호출하여 데이터를 갱신합니다.
    // 지금은 UI 테스트를 위해 1초 후 로딩이 끝나는 것처럼 시뮬레이션합니다.
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  useEffect(() => {
    fetchTodaySchedule();
  }, [userInfo]);

  const fetchTodaySchedule = async () => {
    if (!userInfo) return;
    
    setLoading(true);

    // 오늘 날짜 문자열 만들기 (예: '2026-06-01')
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // 🚨 UI 테스트를 위해 임시로 사용할 더미 데이터
    const dummySchedule = [
      { id: '0', fullDate: '2026-05-31', date: '31', day: '일', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
      { id: '1', fullDate: '2026-06-01', date: '01', day: '월', time: '14:00 - 22:00', storeName: storeName, status: 'COMPLETED' },
      { id: '2', fullDate: '2026-06-02', date: '02', day: '화', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
      { id: '3', fullDate: '2026-06-03', date: '03', day: '수', time: t('offDay'), storeName: '-', status: 'OFF' },
      { id: '4', fullDate: '2026-06-05', date: '05', day: '목', time: '14:00 - 22:00', storeName: storeName, status: 'SCHEDULED' },
      { id: '5', fullDate: '2026-06-06', date: '06', day: '금', time: '14:00 - 22:00', storeName: storeName, status: 'SUBSTITUTE_REQ' },
    ];
    
    // ✅ 스케줄 더미 데이터를 기반으로 이번 주 총 근무 시간과 예상 급여를 자동 계산합니다.
    let calculatedMinutes = 0;
    dummySchedule.forEach(item => {
      if (item.status !== 'OFF' && item.time && item.time.includes(' - ')) {
        const [start, end] = item.time.split(' - ');
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60; // 새벽을 넘기는 근무 (예: 22:00 - 02:00) 처리
        calculatedMinutes += diff;
      }
    });

    const calculatedHours = Math.round((calculatedMinutes / 60) * 10) / 10; // 소수점 첫째 자리까지만 표시
    const dummyStats = {
      totalHours: calculatedHours,
      expectedSalary: calculatedHours * 10320 // 2026년 최저시급 10,320원 적용 (원하는 시급으로 변경 가능)
    };

    try {
      const storeId = userInfo.store_id || userInfo.brandName || 'default_store';
      // 백엔드 API 호출
      const response = await getMyScheduleAPI(userInfo.username, storeId);
      
    } catch (error) {
      console.log("오늘의 근무 불러오기 에러 (더미 데이터 사용 중):", error);
    } finally {
      // 에러가 발생하더라도 화면에 더미 데이터가 무조건 반영되도록 finally 블록에서 처리합니다.
      const scheduleList = dummySchedule;
      const shift = scheduleList.find((item: any) => item.fullDate === todayStr);
      
      // ✅ 실시간 근무 상태 계산 로직 (더미 데이터에 실시간 적용)
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
      setWeeklyStats(dummyStats); // ✅ 나중에 이 부분을 API에서 받아온 값(response.data)으로 교체하면 끝납니다!
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return t('scheduled');
      case 'IN_PROGRESS': return t('inProgress');
      case 'COMPLETED': return t('completed');
      case 'SUBSTITUTE_REQ': return t('substituteReq');
      case 'OFF': return t('offDay');
      default: return '';
    }
  };

  // ✅ 다크 모드일 경우 눈이 편안한 파스텔 톤으로 배지 색상을 변경합니다.
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return { bg: isDarkMode ? '#075985' : '#E0F2FE', text: isDarkMode ? '#BAE6FD' : '#0284C7' };
      case 'IN_PROGRESS': return { bg: isDarkMode ? '#14532D' : '#DCFCE7', text: isDarkMode ? '#86EFAC' : '#16A34A' };
      case 'COMPLETED': return { bg: isDarkMode ? '#374151' : '#F3F4F6', text: isDarkMode ? '#D1D5DB' : '#4B5563' };
      case 'SUBSTITUTE_REQ': return { bg: isDarkMode ? '#78350F' : '#FEF3C7', text: isDarkMode ? '#FDE68A' : '#D97706' };
      case 'OFF': return { bg: isDarkMode ? '#7F1D1D' : '#FEE2E2', text: isDarkMode ? '#FECACA' : '#DC2626' };
      default: return { bg: isDarkMode ? '#374151' : '#F3F4F6', text: isDarkMode ? '#D1D5DB' : '#4B5563' };
    }
  };

  const handleNotification = () => navigation.navigate('Notifications');
  const handleQRCheckIn = () => navigation.navigate('QRCheckIn');

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.logoText}>バイトメート</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.qrButton} onPress={handleQRCheckIn}>
            <Text style={styles.qrButtonText}>{t('qrCheckIn')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {/* 💡 안 읽은 알림이 있을 때만 빨간 점 렌더링 */}
            {unreadCount > 0 && <View style={styles.badge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 메인 컨텐츠 영역 */}
      <ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#2563EB']} // 안드로이드 스피너 색상
            tintColor={isDarkMode ? '#60A5FA' : '#2563EB'} // iOS 스피너 색상
          />
        }
      >
        
        {/* ▼ 환영 인사 영역 추가 ▼ */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{t('greeting')}, {userName}{t('suffixNim')}! 👋</Text>
          <Text style={styles.greetingSubText}>{storeName} | {userInfo?.role === 'ADMIN' ? t('admin') : t('staff')}</Text>
        </View>

        {/* ▼ 오늘의 근무 카드 시작 ▼ */}
        <View style={styles.card}>
          {/* 타이틀 행 */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{t('todayWork')}</Text>
            {todayShift && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayShift.status).bg }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(todayShift.status).text }]}>{getStatusText(todayShift.status)}</Text>
              </View>
            )}
          </View>

          {loading ? (
            // ✅ 스피너 대신 부드럽게 깜빡이는 스켈레톤 UI 적용
            <Animated.View style={{ opacity: fadeAnim, paddingVertical: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
                <View style={{ width: '50%', height: 18, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 6 }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 20, height: 20, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 10, marginRight: 8 }} />
                <View style={{ width: '70%', height: 18, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 6 }} />
              </View>
              <View style={styles.divider} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ width: '30%', height: 18, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 6 }} />
                <View style={{ width: '40%', height: 24, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 6 }} />
              </View>
            </Animated.View>
          ) : todayShift ? (
            <>
              {/* 근무 상세 정보 */}
              <View style={styles.workInfoRow}>
                <Text style={styles.infoIcon}>🕒</Text>
                <Text style={styles.infoText}>{todayShift.time}</Text>
              </View>
              {todayShift.status !== 'OFF' && (
                <View style={styles.workInfoRow}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <Text style={styles.infoText}>{todayShift.storeName}</Text>
                </View>
              )}
              {/* 구분선 */}
              <View style={styles.divider} />
              {/* 급여 정보 */}
              <View style={styles.salaryRow}>
                <Text style={styles.salaryLabel}>{t('expectedDailyWage')}</Text>
                <Text style={styles.salaryValue}>72,000{t('currency')}</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyText}>{t('noScheduleToday')}</Text>
            </View>
          )}
        </View>
        {/* ▲ 오늘의 근무 카드 끝 ▲ */}

        {/* ▼ 통계 반반 카드 시작 ▼ */}
        <TouchableOpacity style={styles.statsCard} onPress={() => navigation.navigate('Payroll', { userInfo })} activeOpacity={0.8}>
          
          {/* 왼쪽: 이번 주 근무 시간 */}
          <View style={styles.statHalf}>
            <Text style={styles.statValue}>{weeklyStats.totalHours}</Text>
            <Text style={styles.statLabel}>{t('weeklyHours')}</Text>
          </View>

          {/* 가운데 구분선 */}
          <View style={styles.verticalDivider} />

          {/* 오른쪽: 이번 주 예상 급여 */}
          <View style={styles.statHalf}>
            {/* 💡 .toLocaleString()을 붙이면 166500이 자동으로 166,500(콤마 추가)으로 예쁘게 바뀝니다. */}
            <Text style={styles.statValue}>{weeklyStats.expectedSalary.toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('weeklySalary')}</Text>
          </View>

        </TouchableOpacity>
        {/* ▲ 통계 반반 카드 끝 ▲ */}

        {/* ▼ 대타 요청 알림 카드 ▼ */}
        {isAlertVisible && (
          <TouchableOpacity style={styles.alertCard} onPress={() => navigation.navigate('Substitute')} activeOpacity={0.8}>
            {/* 💡 누를 수 있다는 걸 알려주기 위해 화살표(〉) 추가 */}
            <View style={styles.alertHeader}> 
              <Text style={styles.alertIcon}>🚨</Text>
              <Text style={styles.alertTitle}>{t('subReqAlertTitle')} 〉</Text>
            </View>
            <Text style={styles.alertDescription}>
              {t('subReqAlertDesc')}
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptSubstitute}>
                <Text style={styles.acceptButtonText}>{t('applyBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectButton} onPress={() => setIsAlertVisible(false)}>
                <Text style={styles.rejectButtonText}>{t('rejectBtn')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        {/* ▲ 대타 요청 알림 카드 끝 ▲ */}

        {/* ▼ 사내 게시판 영역 ▼ */}
        <View style={styles.noticeSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('notice')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Board')}>
              <Text style={styles.moreText}>{t('more')}</Text>
            </TouchableOpacity>
          </View>
          
          {sortedDummyPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(post)} activeOpacity={0.7}>
                <View style={styles.noticeTextContainer}>
                  {/* ✅ 카테고리 배지 추가 */}
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{t(CATEGORIES.find(c => c.id === post.category)?.label || 'boardTabNotice')}</Text>
                  </View>
                  <Text style={styles.noticeItemTitle} numberOfLines={1}>
                    {t(post.title).length > 14 ? t(post.title).substring(0, 14) + '..' : t(post.title)}
                  </Text>
                  {post.badge && (
                    <View style={styles.newBadge}><Text style={styles.newBadgeText}>{t(post.badge)}</Text></View>
                  )}
                </View>
                <Text style={styles.noticeDate}>{post.date}</Text>
              </TouchableOpacity>
              {index < sortedDummyPosts.length - 1 && <View style={styles.noticeDivider} />}
            </React.Fragment>
          ))}
        </View>
        {/* ▲ 사내 게시판 영역 끝 ▲ */}

      </ScrollView>

      {/* ✅ 게시글 상세 보기 팝업(모달) */}
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

// ✅ 테마 색상을 인자로 받아 동적으로 스타일을 생성하도록 변경
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
  logoText: { fontSize: 22, fontWeight: '900', color: '#FF5A5F', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  qrIcon: { fontSize: 14, marginRight: 4 },
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

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: colors.subText, fontWeight: '500' },

  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
    flexDirection: 'row', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  
  statHalf: {
    flex: 1, 
    alignItems: 'center', 
  },

  verticalDivider: {
    width: 1, 
    backgroundColor: colors.border,
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: isDarkMode ? '#34C759' : '#0cbb00',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: isDarkMode ? '#3F3119' : '#FFFBEB',
    borderWidth: 1,
    borderColor: isDarkMode ? '#92400E' : '#FDE68A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: isDarkMode ? '#FCD34D' : '#D97706',
  },
  alertDescription: {
    fontSize: 14,
    color: isDarkMode ? '#E5E7EB' : '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },

  noticeSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moreText: {
    fontSize: 13,
    color: colors.subText,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  noticeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  noticeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  categoryBadge: {
    backgroundColor: isDarkMode ? '#374151' : '#E5E7EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    color: isDarkMode ? '#D1D5DB' : '#4B5563',
    fontSize: 10,
    fontWeight: '700',
  },
  noticeItemTitle: {
    fontSize: 15,
    color: colors.text,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  noticeDate: {
    fontSize: 13,
    color: colors.subText,
  },
  noticeDivider: {
    height: 1,
    backgroundColor: colors.border,
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
});

export default DashboardScreen;
