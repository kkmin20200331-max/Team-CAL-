import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type DashboardScreenNavigationProp = StackNavigationProp<any, 'Dashboard'>;

type Props = {
  navigation: DashboardScreenNavigationProp;
  setIsLoggedIn?: (value: boolean) => void; 
};

const DashboardScreen = ({ setIsLoggedIn }: Props) => {
  
  const handleNotification = () => console.log('알림 화면으로 이동');
  const handleQRCheckIn = () => console.log('QR 출퇴근 카메라 켜기');

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* 1. 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.logoText}>바이토메이토</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.qrButton} onPress={handleQRCheckIn}>
            <Text style={styles.qrIcon}>📷</Text>
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
              <Text style={styles.statusBadgeText}>근무 중</Text>
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
});

export default DashboardScreen;