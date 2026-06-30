import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import { useApp } from '../../contexts/AppContext';
import { format, parseISO } from 'date-fns';
import { ko, enUS, ja } from 'date-fns/locale';
import {
  getSubstitutePostsAPI,
  applySubstituteAPI,
  getMySubstituteApplicationsAPI,
  getShiftAPI,
} from '../../../api/auth';

const SubstituteScreen = ({ navigation }: any) => {
  const { t, language } = useLanguage();
  const { userInfo } = useApp();
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'HISTORY'>('REQUEST');

  const dateLocale = useMemo(() => {
    if (language === 'English') return enUS;
    if (language === '日本語') return ja;
    return ko;
  }, [language]);

  const { colors, isDarkMode } = useTheme();
  const styles = getThemedStyles(colors, isDarkMode);

  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const storeId = userInfo?.activeBranchId || userInfo?.store_id || '';
  const storeName = userInfo?.brandName || userInfo?.store_id || '매장';

  const fetchData = async () => {
    if (!storeId || !userInfo?.id) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    try {
      // 1. 대타 모집글 목록 조회
      const postsRes = await getSubstitutePostsAPI(storeId);
      const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
      const pendingPosts = posts.filter((p: any) => p.status === 'PENDING');

      const mappedRequests = await Promise.all(
        pendingPosts.map(async (post: any) => {
          try {
            const shiftRes = await getShiftAPI(post.shift_id);
            const shift = shiftRes.data;
            let timeStr = '-';
            let wageStr = '0';
            let dateStr = '';

            if (shift) {
              const start = shift.start_time || shift.startTime || '';
              const end = shift.end_time || shift.endTime || '';
              timeStr = `${start.slice(0, 5)} ~ ${end.slice(0, 5)}`;
              dateStr = format(parseISO(shift.work_date || shift.date), t('dateFormatPattern'), { locale: dateLocale });
              
              const [sH, sM] = start.split(':').map(Number);
              const [eH, eM] = end.split(':').map(Number);
              let diff = (eH * 60 + eM) - (sH * 60 + sM);
              if (diff < 0) diff += 24 * 60;
              const wageVal = (diff / 60) * (userInfo.payRate || 9860);
              wageStr = Math.round(wageVal).toLocaleString();
            }

            return {
              id: post.id,
              post_id: post.id,
              store: storeName,
              date: dateStr,
              time: timeStr,
              wage: wageStr,
              role: post.reason || t('substituteRoleDefault'),
              bonus: '+1',
            };
          } catch (e) {
            console.error('스케줄 상세 조회 실패:', e);
            return null;
          }
        })
      );
      setRequests(mappedRequests.filter(item => item !== null));

      // 2. 내 대타 지원 내역 조회
      const appsRes = await getMySubstituteApplicationsAPI(userInfo.id);
      const apps = Array.isArray(appsRes.data) ? appsRes.data : [];

      const mappedHistory = await Promise.all(
        apps.map(async (app: any) => {
          try {
            // 해당 app의 post_id를 통해 매장 전체 post 검색
            const matchedPost = posts.find(p => p.id === app.substitute_post_id);
            if (!matchedPost) return null;

            const shiftRes = await getShiftAPI(matchedPost.shift_id);
            const shift = shiftRes.data;
            let timeStr = '-';
            let dateStr = '';

            if (shift) {
              const start = shift.start_time || shift.startTime || '';
              const end = shift.end_time || shift.endTime || '';
              timeStr = `${start.slice(0, 5)} ~ ${end.slice(0, 5)}`;
              dateStr = format(parseISO(shift.work_date || shift.date), t('dateFormatPattern'), { locale: dateLocale });
            }

            return {
              id: app.id,
              store: storeName,
              date: dateStr,
              time: timeStr,
              earnedBonus: '+1',
            };
          } catch (e) {
            return null;
          }
        })
      );
      setHistory(mappedHistory.filter(item => item !== null));

    } catch (error) {
      console.error('대타 데이터 로딩 실패:', error);
      Toast.show({ type: 'error', text1: t('loadSubstituteFail'), text2: t('checkServerConnection') });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [storeId, userInfo?.id]);

  const handleApply = (item: any) => {
    Alert.alert(
      t('subReqConfirmTitle'),
      `${item.date} ${item.time}\n${t('subReqConfirmMsg')}`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('applyBtn'),
          onPress: async () => {
            try {
              const appId = `SA_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
              await applySubstituteAPI({
                id: appId,
                substitute_post_id: item.post_id,
                applicant_user_id: userInfo?.id || '',
                message: t('substituteApplyDefaultMsg'),
                status: 'PENDING',
              });
              Toast.show({ type: 'success', text1: t('subApplySuccessTitle'), text2: t('subApplySuccessMsg') });
              fetchData();
            } catch (error) {
              console.error('대타 지원 에러:', error);
              Toast.show({ type: 'error', text1: t('applyFail'), text2: t('applyFailDetail') });
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [storeId, userInfo?.id]);

  const renderRequestItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="location-outline" size={16} color={colors.text} />
          <Text style={styles.storeText}>{item.store}</Text>
        </View>
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
          <Ionicons name="chevron-back" size={28} color={colors.text} />
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

      {/* 메인 내용 영역 */}
      {loadingData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'REQUEST' ? (
            <FlatList
              data={requests}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestItem}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={<Text style={styles.emptyText}>{t('subEmptyReq')}</Text>}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          ) : (
            <>
              {/* 내 대타 이력 상단 누적 점수 표시 */}
              <View style={styles.pointSummaryBox}>
                <Text style={styles.pointSummaryTitle}>{t('subPointTotal')}</Text>
                <Text style={styles.pointSummaryValue}>{history.length}{t('subPointUnit')}</Text>
              </View>
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('subEmptyHist')}</Text>}
                refreshControl={
                  <RefreshControl 
                    refreshing={refreshing} 
                    onRefresh={onRefresh} 
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4, width: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: { borderBottomColor: colors.primary },
  tabText: { fontSize: 15, fontWeight: '600', color: colors.subText },
  activeTabText: { color: colors.primary },

  contentContainer: { flex: 1 },
  listContainer: { padding: 20, gap: 16 },
  
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  bonusBadge: { backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bonusBadgeText: { color: isDarkMode ? '#FDE68A' : '#D97706', fontSize: 12, fontWeight: '700' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 14, color: colors.subText },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // 이력 리스트 스타일
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  historyLeft: { flex: 1 },
  historySubText: { fontSize: 14, color: colors.subText, marginTop: 4 },
  historyRight: { justifyContent: 'center', alignItems: 'center' },
  historyBonusText: { fontSize: 18, fontWeight: '800', color: isDarkMode ? '#FDE68A' : '#D97706' },

  pointSummaryBox: {
    backgroundColor: colors.card,
    margin: 20,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointSummaryTitle: { fontSize: 14, color: colors.subText, marginBottom: 8, fontWeight: '600' },
  pointSummaryValue: { fontSize: 32, fontWeight: '900', color: isDarkMode ? '#FDE68A' : '#D97706' },
  
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.subText, fontSize: 15 },
});

export default SubstituteScreen;