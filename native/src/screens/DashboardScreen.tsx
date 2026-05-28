import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
};

const DashboardScreen = ({ navigation, setIsLoggedIn }: Props) => {
  
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
        
        {/* ▼ 오늘의 근무 카드 시작 ▼ */}
        <View style={styles.card}>
          {/* 타이틀 행 */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>오늘의 근무</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>근무 전</Text>
            </View>
          </View>

          {/* 근무 상세 정보 */}
          <View style={styles.workInfoRow}>
            <Text style={styles.infoIcon}>🕒</Text>
            <Text style={styles.infoText}>14:00 ~ 22:00 (8시간)</Text>
          </View>
          <View style={styles.workInfoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>컴포즈 미금점</Text>
          </View>

          {/* 구분선 */}
          <View style={styles.divider} />

          {/* 급여 정보 */}
          <View style={styles.salaryRow}>
            <Text style={styles.salaryLabel}>예상 급여</Text>
            <Text style={styles.salaryValue}>72,000원</Text>
          </View>
        </View>
        {/* ▲ 오늘의 근무 카드 끝 ▲ */}

        {/* ▼ 통계 반반 카드 시작 ▼ */}
        <View style={styles.statsCard}>
          
          {/* 왼쪽: 이번 주 근무 시간 */}
          <View style={styles.statHalf}>
            <Text style={styles.statValue}>18.5</Text>
            <Text style={styles.statLabel}>이번 주 근무 시간</Text>
          </View>

          {/* 가운데 구분선 */}
          <View style={styles.verticalDivider} />

          {/* 오른쪽: 이번 주 예상 급여 */}
          <View style={styles.statHalf}>
            <Text style={styles.statValue}>166,500</Text>
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

        {/* ▼ 최근 공지사항 영역 ▼ */}
        <View style={styles.noticeSection}>
          <Text style={styles.sectionTitle}>최근 공지사항</Text>
          
          <TouchableOpacity style={styles.noticeItem}>
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeItemTitle} numberOfLines={1}>
                가을 시즌 신메뉴 출시 안내
              </Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </View>
            <Text style={styles.noticeDate}>2026.08.25</Text>
          </TouchableOpacity>
          
          <View style={styles.noticeDivider} />

          <TouchableOpacity style={styles.noticeItem}>
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeItemTitle} numberOfLines={1}>
                보건증 만료 재확인 요청
              </Text>
            </View>
            <Text style={styles.noticeDate}>2026.05.28</Text>
          </TouchableOpacity>

          <View style={styles.noticeDivider} />

          <TouchableOpacity style={styles.noticeItem}>
            <View style={styles.noticeTextContainer}>
              <Text style={styles.noticeItemTitle} numberOfLines={1}>
                김선민 CAL 입사 경축
              </Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>중요!</Text>
              </View>
            </View>
            <Text style={styles.noticeDate}>2026.09.20</Text>
          </TouchableOpacity>
        </View>
        {/* ▲ 최근 공지사항 영역 끝 ▲ */}

      </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
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
});

export default DashboardScreen;
