import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

const SubstituteScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  
  // ✅ 탭 상태 관리 ('REQUEST' = 대타 요청 목록, 'HISTORY' = 내 대타 이력)
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'HISTORY'>('REQUEST');

  // 더미 데이터 1. 대타 요청 목록
  const requestData = [
    { id: '1', store: '컴포즈 미금점', date: '6월 3일 (수)', time: '17:00 ~ 22:00', wage: '51,600', role: '마감 가능자 우대', bonus: '+3' },
    { id: '2', store: '컴포즈 판교점', date: '6월 5일 (금)', time: '12:00 ~ 17:00', wage: '51,600', role: '일반 직원', bonus: '+2' },
  ];

  // 더미 데이터 2. 내 대타 이력
  const historyData = [
    { id: '1', store: '컴포즈 미금점', date: '5월 20일 (월)', time: '14:00 ~ 18:00', earnedBonus: '+2' },
    { id: '2', store: '컴포즈 미금점', date: '5월 15일 (수)', time: '18:00 ~ 22:00', earnedBonus: '+3' },
  ];

  // 대타 지원 버튼 누를 때
  const handleApply = (item: any) => {
    Alert.alert(
      t('subReqConfirmTitle'),
      `${item.date} ${item.time}\n${t('subReqConfirmMsg')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('applyBtn'), onPress: () => Alert.alert(t('subApplySuccessTitle'), t('subApplySuccessMsg')) }
      ]
    );
  };

  // --- 리스트 렌더링 함수 ---
  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.storeText}>📍 {item.store}</Text>
        <View style={styles.bonusBadge}>
          <Text style={styles.bonusBadgeText}>{item.bonus}{t('subPointUnit')}</Text>
        </View>
      </View>
      <Text style={styles.dateText}>{item.date} {item.time}</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('roleLabel')}</Text>
        <Text style={styles.infoValue}>{item.role}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{t('expectedDailyWage')}</Text>
        <Text style={styles.infoValue}>{item.wage}{t('currency')}</Text>
      </View>

      <TouchableOpacity style={styles.applyButton} onPress={() => handleApply(item)}>
        <Text style={styles.applyButtonText}>{t('applyBtn')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={[styles.card, styles.historyCard]}>
      <View style={styles.historyLeft}>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.historySubText}>{item.store} | {item.time}</Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyBonusText}>{item.earnedBonus}{t('subPointUnit')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('substituteTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 커스텀 탭 버튼 영역 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'REQUEST' && styles.activeTabButton]}
          onPress={() => setActiveTab('REQUEST')}
        >
          <Text style={[styles.tabText, activeTab === 'REQUEST' && styles.activeTabText]}>{t('subTabRequest')}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'HISTORY' && styles.activeTabButton]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.activeTabText]}>{t('subTabHistory')}</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 내용 영역 */}
      <View style={styles.contentContainer}>
        {activeTab === 'REQUEST' ? (
          <FlatList
            data={requestData}
            keyExtractor={(item) => item.id}
            renderItem={renderRequestItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={<Text style={styles.emptyText}>{t('subEmptyReq')}</Text>}
          />
        ) : (
          <>
            {/* 내 대타 이력 상단 누적 점수 표시 */}
            <View style={styles.pointSummaryBox}>
              <Text style={styles.pointSummaryTitle}>{t('subPointTotal')}</Text>
              <Text style={styles.pointSummaryValue}>5{t('subPointUnit')}</Text>
            </View>
            <FlatList
              data={historyData}
              keyExtractor={(item) => item.id}
              renderItem={renderHistoryItem}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyText}>{t('subEmptyHist')}</Text>}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#FFFFFF',
  },
  backButton: { padding: 4, width: 40 },
  backButtonText: { fontSize: 24, color: '#333' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: { borderBottomColor: '#2563EB' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#2563EB' },

  contentContainer: { flex: 1 },
  listContainer: { padding: 20, gap: 16 },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  bonusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bonusBadgeText: { color: '#D97706', fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  
  applyButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // 이력 리스트 스타일
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  historyLeft: { flex: 1 },
  historySubText: { fontSize: 14, color: '#6B7280', marginTop: -10 },
  historyRight: { justifyContent: 'center', alignItems: 'center' },
  historyBonusText: { fontSize: 18, fontWeight: '800', color: '#D97706' },

  pointSummaryBox: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  pointSummaryTitle: { fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '600' },
  pointSummaryValue: { fontSize: 32, fontWeight: '900', color: '#D97706' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9CA3AF', fontSize: 15 },
});

export default SubstituteScreen;