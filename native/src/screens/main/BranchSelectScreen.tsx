import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllStoresAPI, getMyStoreMembershipsAPI, getStoresAPI, requestStoreJoinAPI } from '../../../api/auth';
import { useLanguage } from '../../contexts/LanguageContext';

const selectScreenTranslations = {
  ko: {
    error: '오류',
    fetchStoreFailed: '근무 지점 정보를 불러오지 못했습니다.',
    defaultStoreTitle: '근무 매장',
    notice: '알림',
    selectStoreAlert: '근무할 지점을 선택해주세요.',
    storeSelectError: '지점 선택 중 문제가 발생했습니다.',
    noLoginInfo: '로그인 정보가 없습니다.',
    requestCompleted: '요청 완료',
    requestSentMsg: '관리자에게 근무 요청 알림을 보냈습니다.',
    requestFailed: '요청 실패',
    requestFailedMsg: '이미 신청했거나 요청을 처리하지 못했습니다.',
    confirmRequestTitle: '근무 요청',
    confirmRequestMsg: (title: string) => `${title}에 근무 요청을 보내시겠습니까?`,
    cancel: '취소',
    request: '요청',
    connected: '연결됨',
    pending: '승인 대기',
    requesting: '요청 중',
    adminTitle: '관리 지점 선택',
    employeeTitle: '근무 지점 확인',
    adminSubtitle: '운영할 매장을 선택해주세요.',
    employeeSubtitle: '승인된 지점은 입장하고, 미승인 지점은 요청 상태를 확인하세요.',
    searchResult: '검색 결과',
    approved: '승인',
    pendingShort: '대기',
    searchTitle: '매장 검색',
    searchGuide: '근무할 매장을 검색해서 관리자에게 요청을 보내세요.',
    searchPlaceholder: '매장명 또는 주소 검색',
    noRegisteredStoreTitle: '등록된 매장이 없습니다.',
    noRegisteredStoreDesc: '먼저 웹 관리자 화면에서 매장을 등록해주세요.',
    noSearchResultsTitle: '검색된 매장이 없습니다.',
    noSearchResultsDesc: '매장명 또는 주소를 다시 확인해주세요.',
    selectCompleted: '선택 완료',
    refresh: '새로고침',
    logout: '로그아웃',
  },
  en: {
    error: 'Error',
    fetchStoreFailed: 'Failed to load branch information.',
    defaultStoreTitle: 'Workplace',
    notice: 'Notice',
    selectStoreAlert: 'Please select a branch to work at.',
    storeSelectError: 'A problem occurred while selecting the branch.',
    noLoginInfo: 'No login information found.',
    requestCompleted: 'Request Completed',
    requestSentMsg: 'Sent work request notification to manager.',
    requestFailed: 'Request Failed',
    requestFailedMsg: 'Already applied or failed to process the request.',
    confirmRequestTitle: 'Work Request',
    confirmRequestMsg: (title: string) => `Send work request to ${title}?`,
    cancel: 'Cancel',
    request: 'Request',
    connected: 'Connected',
    pending: 'Pending',
    requesting: 'Requesting',
    adminTitle: 'Select Manage Branch',
    employeeTitle: 'Confirm Work Branch',
    adminSubtitle: 'Please select a branch to operate.',
    employeeSubtitle: 'Enter approved branches, or check request status for unapproved ones.',
    searchResult: 'Results',
    approved: 'Approved',
    pendingShort: 'Pending',
    searchTitle: 'Store Search',
    searchGuide: 'Search for a store to work at and send a request to the manager.',
    searchPlaceholder: 'Search store name or address',
    noRegisteredStoreTitle: 'No stores registered.',
    noRegisteredStoreDesc: 'Please register the store on the web admin page first.',
    noSearchResultsTitle: 'No stores found.',
    noSearchResultsDesc: 'Please check the store name or address again.',
    selectCompleted: 'Select Done',
    refresh: 'Refresh',
    logout: 'Logout',
  },
  ja: {
    error: 'エラー',
    fetchStoreFailed: '勤務店舗情報を取得できませんでした。',
    defaultStoreTitle: '勤務店舗',
    notice: 'お知らせ',
    selectStoreAlert: '勤務する店舗を選択してください。',
    storeSelectError: '店舗選択中に問題が発生しました。',
    noLoginInfo: 'ログイン情報がありません。',
    requestCompleted: 'リクエスト完了',
    requestSentMsg: '管理者に勤務リクエスト通知を送信しました。',
    requestFailed: 'リクエスト失敗',
    requestFailedMsg: '既に申請済みか、リクエストを処理できませんでした。',
    confirmRequestTitle: '勤務リクエスト',
    confirmRequestMsg: (title: string) => `${title}に勤務リクエストを送信しますか？`,
    cancel: 'キャンセル',
    request: '申請',
    connected: '接続済み',
    pending: '承認待ち',
    requesting: '申請中',
    adminTitle: '管理店舗選択',
    employeeTitle: '勤務店舗確認',
    adminSubtitle: '運営する店舗を選択してください。',
    employeeSubtitle: '承認された店舗は入場し、未承認店舗は申請状況を確認してください。',
    searchResult: '検索結果',
    approved: '承認',
    pendingShort: '待機',
    searchTitle: '店舗検索',
    searchGuide: '勤務する店舗を検索して、管理者に申請を送信してください。',
    searchPlaceholder: '店舗名または住所で検索',
    noRegisteredStoreTitle: '登録された店舗がありません。',
    noRegisteredStoreDesc: '先にWeb管理者画面から店舗を登録してください。',
    noSearchResultsTitle: '検索された店舗がありません。',
    noSearchResultsDesc: '店舗名または住所を再度ご確認ください。',
    selectCompleted: '選択完了',
    refresh: '更新',
    logout: 'ログアウト',
  }
};

const BranchSelectScreen = ({ navigation }: { navigation?: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const { userInfo, login, logout } = useApp();
  const { language } = useLanguage();
  const lang = language === 'English' ? 'en' : language === '日本語' ? 'ja' : 'ko';
  const localT = selectScreenTranslations[lang];

  // 화면 상태: 선택 지점, 매장 목록, 검색어, 요청 진행 상태를 관리합니다.
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [requestingStoreId, setRequestingStoreId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // 매장 데이터 로딩: 관리자는 본인 매장, 직원은 전체 매장과 가입 상태를 함께 불러옵니다.
  useEffect(() => {
    let alive = true;

    const loadStores = async () => {
      if (!userInfo?.id) {
        setLoading(false);
        return;
      }

      try {
        if (userInfo.role === 'ADMIN') {
          const response = await getStoresAPI(userInfo.id);
          const data = response.data;
          const normalized = Array.isArray(data) ? data : data ? [data] : [];

          if (!alive) return;

          setStores(normalized);
          setAllStores([]);
          if (normalized.length === 1) {
            setSelectedStore(normalized[0]);
          }
          return;
        }

        const [allStoreResponse, membershipResponse] = await Promise.all([
          getAllStoresAPI(),
          getMyStoreMembershipsAPI(userInfo.id),
        ]);

        if (!alive) return;

        const allStoreList = Array.isArray(allStoreResponse.data) ? allStoreResponse.data : [];
        const memberships = Array.isArray(membershipResponse.data) ? membershipResponse.data : [];
        const membershipByStoreId = new Map(
          memberships.map((store: any) => [store.id, store]),
        );
        const mergedStores = allStoreList.map((store: any) => ({
          ...store,
          approval_status: membershipByStoreId.get(store.id)?.approval_status || 'NONE',
          member_role: membershipByStoreId.get(store.id)?.member_role,
        }));

        setAllStores(mergedStores);
        setStores(mergedStores.filter((store: any) => store.approval_status === 'APPROVED'));
      } catch (error) {
        console.error('지점 조회 오류:', error);
        if (alive) {
          Alert.alert(localT.error, localT.fetchStoreFailed);
          setStores([]);
          setAllStores([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadStores();

    return () => {
      alive = false;
    };
  }, [userInfo?.id, userInfo?.role, reloadKey]);

  // 매장 표시용 헬퍼: API 응답 필드명이 조금 달라도 화면에서 같은 형태로 보여줍니다.
  const getStoreTitle = (store: any) => store.name || store.brandName || localT.defaultStoreTitle;
  const getStoreSubtitle = (store: any) => store.address || store.branchName || store.id;
  const getApprovalStatus = (store: any) =>
    String(store.approval_status || 'NONE').toUpperCase();

  // 검색/통계 계산: 현재 화면에 보이는 매장 기준으로 결과 수와 승인 상태를 계산합니다.
  const filteredAllStores = allStores.filter((store) => {
    const q = storeSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return `${getStoreTitle(store)} ${getStoreSubtitle(store)}`.toLowerCase().includes(q);
  });

  const visibleStores = userInfo?.role !== 'ADMIN' ? filteredAllStores : stores;
  const approvedCount = visibleStores.filter(store => getApprovalStatus(store) === 'APPROVED').length;
  const pendingCount = visibleStores.filter(store => getApprovalStatus(store) === 'PENDING').length;

  // 매장 입장 처리: 선택한 매장을 로컬 저장소와 앱 전역 사용자 정보에 반영합니다.
  const enterStore = async (store: any) => {
    if (!store) {
      Alert.alert(localT.notice, localT.selectStoreAlert);
      return;
    }

    try {
      if (userInfo) {
        await AsyncStorage.setItem(`store_${userInfo.username}`, store.id);
        
        const updatedUserInfo = {
          ...userInfo,
          store_id: store.id,
          brandName: store.name || store.brandName || localT.defaultStoreTitle,
          branchName: store.name || store.branchName || store.id,
        };
        login(updatedUserInfo, true);
      }

    } catch (error) {
      console.error("지점 선택 저장 오류:", error);
      Alert.alert(localT.error, localT.storeSelectError);
    }
  };

  // 매장 선택 처리: 관리자는 선택만 하고, 직원은 승인된 매장으로 바로 입장합니다.
  const handleSelectStore = (store: any) => {
    if (userInfo?.role === 'ADMIN') {
      setSelectedStore(store);
      return;
    }

    enterStore(store);
  };

  const handleConfirm = async () => {
    await enterStore(selectedStore);
  };

  // 관리자용 매장 카드: 운영할 지점을 선택하는 리스트 항목입니다.
  const renderStoreItem = ({ item }: { item: any }) => {
    const isSelected = selectedStore?.id === item.id;
    const title = getStoreTitle(item);
    const subtitle = getStoreSubtitle(item);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, userInfo?.role !== 'ADMIN' && styles.enterCard]}
        onPress={() => handleSelectStore(item)}
      >
        <View style={[styles.storeIcon, isSelected && styles.storeIconSelected]}>
          <Ionicons name="business-outline" size={20} color={isSelected ? '#FFFFFF' : colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brandName, isSelected && styles.textSelected]}>{title}</Text>
          <Text style={[styles.branchName, isSelected && styles.textSelected]}>{subtitle}</Text>
        </View>
        {userInfo?.role !== 'ADMIN' && (
          <View style={styles.enterBadge}>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 직원 근무 요청: 미승인 매장에 가입 요청을 보내고 화면 상태를 갱신합니다.
  const handleRequestStoreJoin = async (store: any) => {
    if (!userInfo?.id) {
      Alert.alert(localT.error, localT.noLoginInfo);
      return;
    }

    const submitRequest = async () => {
      setRequestingStoreId(store.id);
      try {
        await requestStoreJoinAPI(userInfo.id, store.id);
        Alert.alert(localT.requestCompleted, localT.requestSentMsg);
        setAllStores(prev =>
          prev.map(item =>
            item.id === store.id
              ? { ...item, approval_status: 'PENDING', member_role: 'STAFF' }
              : item,
          ),
        );
        setReloadKey(prev => prev + 1);
      } catch (error: any) {
        Alert.alert(
          localT.requestFailed,
          error.response?.data?.message || error.response?.data || localT.requestFailedMsg,
        );
      } finally {
        setRequestingStoreId(null);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(localT.confirmRequestMsg(getStoreTitle(store)));
      if (ok) {
        await submitRequest();
      }
      return;
    }

    Alert.alert(
      localT.confirmRequestTitle,
      localT.confirmRequestMsg(getStoreTitle(store)),
      [
        { text: localT.cancel, style: 'cancel' },
        {
          text: localT.request,
          onPress: submitRequest,
        },
      ],
    );
  };

  // 직원용 매장 카드: 승인/대기/요청 상태를 한눈에 보여줍니다.
  const renderRequestStoreItem = ({ item }: { item: any }) => {
    const approvalStatus = getApprovalStatus(item);

    return (
    <View style={styles.requestCard}>
      <View style={styles.requestIcon}>
        <Ionicons
          name={approvalStatus === 'APPROVED' ? 'sparkles-outline' : approvalStatus === 'PENDING' ? 'time-outline' : 'storefront-outline'}
          size={21}
          color={approvalStatus === 'APPROVED' ? colors.primary : approvalStatus === 'PENDING' ? colors.warning : colors.primaryDark}
        />
      </View>
      <View style={styles.requestContent}>
        <View style={styles.storeTitleRow}>
          <Text style={styles.requestStoreName}>{getStoreTitle(item)}</Text>
          {approvalStatus === 'APPROVED' && (
            <View style={styles.approvedPill}>
              <Text style={styles.approvedPillText}>{localT.connected}</Text>
            </View>
          )}
        </View>
        <Text style={styles.requestStoreAddress}>{getStoreSubtitle(item)}</Text>
      </View>
      {approvalStatus === 'APPROVED' ? (
        <TouchableOpacity style={styles.requestButton} onPress={() => enterStore(item)}>
          <Ionicons name="enter-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : approvalStatus === 'PENDING' ? (
        <View style={styles.pendingButton}>
          <Text style={styles.pendingButtonText}>{localT.pending}</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.requestButton, requestingStoreId === item.id && styles.requestButtonDisabled]}
          onPress={() => handleRequestStoreJoin(item)}
          disabled={requestingStoreId === item.id}
        >
          <Text style={styles.requestButtonText}>
            {requestingStoreId === item.id ? localT.requesting : localT.request}
          </Text>
        </TouchableOpacity>
      )}
    </View>
    );
  };

  // 화면 구성: AI 매칭 헤더, 검색 영역, 매장 리스트, 하단 액션 버튼으로 구성합니다.
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerGlow} />
        <View style={styles.headerTopRow}>
          <View style={styles.aiChip}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.aiChipText}>AI Branch Match</Text>
          </View>
          <View style={styles.headerIcon}>
            <Ionicons name="scan-outline" size={20} color={colors.primary} />
          </View>
        </View>
        <Text style={styles.title}>{userInfo?.role === 'ADMIN' ? localT.adminTitle : localT.employeeTitle}</Text>
        <Text style={styles.subtitle}>
          {userInfo?.role === 'ADMIN'
            ? localT.adminSubtitle
            : localT.employeeSubtitle}
        </Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{visibleStores.length}</Text>
            <Text style={styles.metricLabel}>{localT.searchResult}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{approvedCount}</Text>
            <Text style={styles.metricLabel}>{localT.approved}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricValue}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>{localT.pendingShort}</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={visibleStores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          userInfo?.role !== 'ADMIN' && !loading ? (
            <View style={styles.searchSection}>
              <View>
                <Text style={styles.searchTitle}>{localT.searchTitle}</Text>
                <Text style={styles.searchGuide}>{localT.searchGuide}</Text>
              </View>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search-outline" size={18} color={colors.primary} />
                <TextInput
                  style={styles.searchInput}
                  value={storeSearchTerm}
                  onChangeText={setStoreSearchTerm}
                  placeholder={localT.searchPlaceholder}
                  placeholderTextColor={colors.subText}
                />
              </View>
            </View>
          ) : null
        }
        renderItem={
          userInfo?.role !== 'ADMIN'
            ? renderRequestStoreItem
            : renderStoreItem
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : userInfo?.role === 'ADMIN' ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{localT.noRegisteredStoreTitle}</Text>
              <Text style={styles.emptyText}>{localT.noRegisteredStoreDesc}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>{localT.noSearchResultsTitle}</Text>
              <Text style={styles.emptyText}>{localT.noSearchResultsDesc}</Text>
            </View>
          )
        }
      />
      <View style={styles.bottomContainer}>
        {userInfo?.role === 'ADMIN' && stores.length > 0 && (
          <TouchableOpacity
            style={[styles.confirmButton, !selectedStore && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            disabled={!selectedStore}
          >
            <Text style={styles.confirmButtonText}>{localT.selectCompleted}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setReloadKey(prev => prev + 1)}>
          <Text style={styles.secondaryButtonText}>{localT.refresh}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>{localT.logout}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 디자인 토큰: AI 서비스 느낌을 주는 밝은 콘솔 톤과 카드형 레이아웃입니다.
const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: '#F8FBFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DDE9F6',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    right: -54,
    top: -70,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(19, 197, 166, 0.16)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BDEFE0',
  },
  aiChipText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE9F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 21,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  metricPill: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  searchSection: {
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  searchTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  searchGuide: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 14,
    lineHeight: 20,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DDE9F6',
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  enterCard: {
    borderColor: '#DDE9F6',
  },
  cardSelected: {
    borderColor: '#13C5A6',
    backgroundColor: '#F0FDFA',
  },
  storeIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BDEFE0',
  },
  storeIconSelected: {
    backgroundColor: '#13C5A6',
    borderColor: '#13C5A6',
  },
  enterBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  requestIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#BDEFE0',
  },
  requestContent: {
    flex: 1,
    minWidth: 0,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  approvedPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#ECFDF5',
  },
  approvedPillText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '900',
  },
  enterBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  brandName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  branchName: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '700',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  requestStoreName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
  },
  requestStoreAddress: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  requestButton: {
    minWidth: 46,
    minHeight: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  requestButtonDisabled: {
    opacity: 0.5,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  pendingButton: {
    backgroundColor: '#FFF7ED',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingButtonText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyContainer: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    textAlign: 'center',
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.subText,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
  },
  textSelected: {
    color: '#047857',
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#DDE9F6',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#0F172A',
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE9F6',
    backgroundColor: '#F8FAFC',
  },
  secondaryButtonText: {
    color: '#047857',
    fontSize: 16,
    fontWeight: '900',
  },
  logoutButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default BranchSelectScreen;