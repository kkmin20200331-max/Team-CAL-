import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getMyScheduleAPI } from '../../api/auth';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
  userInfo?: any; // App.tsx에서 전달받은 유저 정보
};

const DashboardScreen = ({ navigation, setIsLoggedIn, userInfo }: Props) => {
  
  // 백엔드에서 전달받은 정보 파싱 (없을 경우 기본값)
  const userName = userInfo?.name || '사용자';
  const storeName = userInfo?.brandName || userInfo?.store_id || '컴포즈 미금점';

  // ✅ 오늘의 근무 상태 관리
  const [todayShift, setTodayShift] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  // ✅ 이번 주 통계 상태 관리
  const [weeklyStats, setWeeklyStats] = useState({ totalHours: 0, expectedSalary: 0 });

  // ✅ 게시판 데이터 및 모달 상태 관리
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const dummyPosts = [
    { id: '1', title: '가을 시즌 신메뉴 출시 안내', date: '2026.08.25', content: '가을 시즌 신메뉴가 곧 출시됩니다!\n\n레시피 및 상세 매뉴얼은 추후 관리자가 업로드 할 예정이니 꼭 확인해 주세요.', badge: 'NEW' },
    { id: '2', title: '보건증 만료 재확인 요청', date: '2026.05.28', content: '안녕하세요, 점주입니다.\n\n최근 보건증 만료일이 도래하는 직원분들이 많습니다. 각자 마이페이지에서 보건증 유효기간을 확인하시고, 만료 전 반드시 보건소에 방문하시어 갱신해 주시기 바랍니다.', badge: null },
    { id: '3', title: '김선민 CAL 입사 경축', date: '2026.09.20', content: '새로운 팀원 김선민님이 CAL에 합류하셨습니다!\n모두 반갑게 인사하며 따뜻한 환영 부탁드립니다. 🎉', badge: '중요!' },
  ];

  const handleOpenPost = (post: any) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  };

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
      { id: '3', fullDate: '2026-06-03', date: '03', day: '수', time: '휴무', storeName: '-', status: 'OFF' },
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
      case 'SCHEDULED': return '근무 예정';
      case 'IN_PROGRESS': return '근무 중';
      case 'COMPLETED': return '근무 완료';
      case 'SUBSTITUTE_REQ': return '대타 찾는 중';
      case 'OFF': return '휴무';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'SCHEDULED': return { bg: '#E0F2FE', text: '#0284C7' };
      case 'IN_PROGRESS': return { bg: '#DCFCE7', text: '#16A34A' }; // 초록색 (진행 중 강조)
      case 'COMPLETED': return { bg: '#F3F4F6', text: '#4B5563' };
      case 'SUBSTITUTE_REQ': return { bg: '#FEF3C7', text: '#D97706' };
      case 'OFF': return { bg: '#FEE2E2', text: '#DC2626' };
      default: return { bg: '#F3F4F6', text: '#4B5563' };
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
            <Text style={styles.qrButtonText}>QR출퇴근</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 메인 컨텐츠 영역 */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        
        {/* ▼ 환영 인사 영역 추가 ▼ */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>안녕하세요, {userName} 님! 👋</Text>
          <Text style={styles.greetingSubText}>{storeName} | {userInfo?.role === 'ADMIN' ? '관리자' : '일반 직원'}</Text>
        </View>

        {/* ▼ 오늘의 근무 카드 시작 ▼ */}
        <View style={styles.card}>
          {/* 타이틀 행 */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>오늘의 근무</Text>
            {todayShift && (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(todayShift.status).bg }]}>
                <Text style={[styles.statusBadgeText, { color: getStatusColor(todayShift.status).text }]}>{getStatusText(todayShift.status)}</Text>
              </View>
            )}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 20 }} />
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
                <Text style={styles.salaryLabel}>예상 일급</Text>
                <Text style={styles.salaryValue}>72,000원</Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyText}>오늘은 근무 일정이 없습니다.</Text>
            </View>
          )}
        </View>
        {/* ▲ 오늘의 근무 카드 끝 ▲ */}

        {/* ▼ 통계 반반 카드 시작 ▼ */}
        <View style={styles.statsCard}>
          
          {/* 왼쪽: 이번 주 근무 시간 */}
          <View style={styles.statHalf}>
            <Text style={styles.statValue}>{weeklyStats.totalHours}</Text>
            <Text style={styles.statLabel}>이번 주 근무 시간</Text>
          </View>

          {/* 가운데 구분선 */}
          <View style={styles.verticalDivider} />

          {/* 오른쪽: 이번 주 예상 급여 */}
          <View style={styles.statHalf}>
            {/* 💡 .toLocaleString()을 붙이면 166500이 자동으로 166,500(콤마 추가)으로 예쁘게 바뀝니다. */}
            <Text style={styles.statValue}>{weeklyStats.expectedSalary.toLocaleString()}</Text>
            <Text style={styles.statLabel}>이번 주 예상급여</Text>
          </View>

        </View>
        {/* ▲ 통계 반반 카드 끝 ▲ */}

        {/* ▼ 대타 요청 알림 카드 ▼ */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>🚨</Text>
            <Text style={styles.alertTitle}>대타 요청이 있습니다</Text>
          </View>
          <Text style={styles.alertDescription}>
            5월 28일 수요일 17:00 ~ 22:00 대타 가능하신가요?
          </Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>지원하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton}>
              <Text style={styles.rejectButtonText}>거절</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ▲ 대타 요청 알림 카드 끝 ▲ */}

        {/* ▼ 사내 게시판 영역 ▼ */}
        <View style={styles.noticeSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>사내 게시판</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Board')}>
              <Text style={styles.moreText}>더보기</Text>
            </TouchableOpacity>
          </View>
          
          {dummyPosts.map((post, index) => (
            <React.Fragment key={post.id}>
              <TouchableOpacity style={styles.noticeItem} onPress={() => handleOpenPost(post)} activeOpacity={0.7}>
                <View style={styles.noticeTextContainer}>
                  <Text style={styles.noticeItemTitle} numberOfLines={1}>{post.title}</Text>
                  {post.badge && (
                    <View style={styles.newBadge}><Text style={styles.newBadgeText}>{post.badge}</Text></View>
                  )}
                </View>
                <Text style={styles.noticeDate}>{post.date}</Text>
              </TouchableOpacity>
              {index < dummyPosts.length - 1 && <View style={styles.noticeDivider} />}
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
                <Text style={styles.postModalTitle}>{selectedPost.title}</Text>
                <Text style={styles.postModalDate}>{selectedPost.date}</Text>
                <View style={styles.postModalDivider} />
                <ScrollView style={styles.postModalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.postModalText}>{selectedPost.content}</Text>
                </ScrollView>
                <TouchableOpacity style={styles.closeModalButton} onPress={() => setPostModalVisible(false)}>
                  <Text style={styles.closeModalButtonText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8', // 앱 전체 배경 (밝은 회색)
  },
  // ... (기존 헤더 스타일은 동일하게 유지) ...
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  logoText: { fontSize: 22, fontWeight: '900', color: '#FF5A5F', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qrButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  qrIcon: { fontSize: 14, marginRight: 4 },
  qrButtonText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  notificationButton: { padding: 4, position: 'relative' },
  notificationIcon: { fontSize: 22 },
  badge: { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1, borderColor: '#FFFFFF' },
  
  contentContainer: {
    flex: 1,
    padding: 16, // 스크롤 뷰 전체의 안쪽 여백
  },
  
  // --- 환영 인사 스타일 ---
  greetingSection: {
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  greetingSubText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  // --- 카드 컴포넌트 스타일 ---
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    // 안드로이드 그림자
    elevation: 2,
    // iOS 그림자
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
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#E0F2FE', // 밝은 파란색 배경
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#0284C7',
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
    color: '#4B5563',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16, // 위아래 여백
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  salaryValue: {
    fontSize: 18,
    color: '#111827',
    fontWeight: '700',
  },

  // --- 빈 일정 안내 스타일 ---
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },

  // --- 반반 통계 카드 스타일 ---
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 24, // 위아래 여백
    marginBottom: 16,
    
    // [퀴즈 1] 자식 요소(왼쪽, 선, 오른쪽)들이 가로로 나란히 배치되도록 방향을 설정해주세요.
    flexDirection: 'row', 

    // 그림자 효과 (기존 카드와 동일)
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  
  statHalf: {
    // [퀴즈 2] 왼쪽과 오른쪽 영역이 남은 공간을 1:1로 공평하게 나눠 가지도록 속성을 넣어주세요.
    flex: 1, 
    
    // 텍스트들이 각 영역의 가운데(수평 중앙)에 오도록 정렬합니다.
    alignItems: 'center', 
  },

  verticalDivider: {
    // [퀴즈 3] 세로 구분선의 두께를 1픽셀로 만들고 싶습니다. 어떤 속성을 써야 할까요?
    width: 1, 
    backgroundColor: '#E5E7EB',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0cbb00',
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // --- 대타 요청 알림 카드 스타일 ---
  alertCard: {
    backgroundColor: '#FFFBEB', // 시선을 끄는 옅은 노란색 배경
    borderWidth: 1,
    borderColor: '#FDE68A',
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
    color: '#D97706', // 짙은 오렌지/노란색 텍스트
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12, // 버튼 사이 간격
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },

  // --- 공지사항 리스트 스타일 ---
  noticeSection: {
    backgroundColor: '#FFFFFF', // 하얀색 배경으로 독립적인 카드 느낌 부여
    borderRadius: 16,           // 모서리 둥글게
    padding: 20,                // 카드 안쪽 여백
    marginBottom: 40,           // 아래쪽 여백 (스크롤 넉넉하게)
    marginTop: 8,               // 윗부분(대타 요청 카드)과의 간격 살짝 추가
    
    // 그림자 효과 부여 (입체감으로 분리감 극대화)
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
    color: '#6B7280',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
    flex: 1, // 글자가 길어지면 줄임표(...) 처리되도록 공간 확보
    paddingRight: 10,
  },
  noticeItemTitle: {
    fontSize: 15,
    color: '#374151',
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
    color: '#9CA3AF',
  },
  noticeDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  // --- 게시글 상세 모달 스타일 ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  postModalContent: { width: '85%', maxHeight: '70%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  postModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  postModalDate: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  postModalDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  postModalBody: { marginBottom: 20 },
  postModalText: { fontSize: 15, color: '#374151', lineHeight: 24 },
  closeModalButton: { backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  closeModalButtonText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
});

export default DashboardScreen;
