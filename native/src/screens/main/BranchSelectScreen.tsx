import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllStoresAPI, getMyStoreMembershipsAPI, getStoresAPI, requestStoreJoinAPI } from '../../../api/auth';

const BranchSelectScreen = ({ navigation }: { navigation: any }) => {
  const { colors } = useTheme();
  const styles = getThemedStyles(colors);

  const { userInfo, login, logout } = useApp();
  
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [allStores, setAllStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [requestingStoreId, setRequestingStoreId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

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
          Alert.alert('오류', '근무 지점 정보를 불러오지 못했습니다.');
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

  const getStoreTitle = (store: any) => store.name || store.brandName || '근무 매장';
  const getStoreSubtitle = (store: any) => store.address || store.branchName || store.id;

  const filteredAllStores = allStores.filter((store) => {
    const q = storeSearchTerm.trim().toLowerCase();
    if (!q) return true;
    return `${getStoreTitle(store)} ${getStoreSubtitle(store)}`.toLowerCase().includes(q);
  });

  const getApprovalStatus = (store: any) =>
    String(store.approval_status || 'NONE').toUpperCase();

  const enterStore = async (store: any) => {
    if (!store) {
      Alert.alert("알림", "근무할 지점을 선택해주세요.");
      return;
    }

    try {
      if (userInfo) {
        await AsyncStorage.setItem(`store_${userInfo.username}`, store.id);
        
        const updatedUserInfo = {
          ...userInfo,
          store_id: store.id,
          brandName: store.name || store.brandName || '근무 매장',
          branchName: store.name || store.branchName || store.id,
        };
        login(updatedUserInfo, true);
      }

    } catch (error) {
      console.error("지점 선택 저장 오류:", error);
      Alert.alert("오류", "지점 선택 중 문제가 발생했습니다.");
    }
  };

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

  const renderStoreItem = ({ item }: { item: any }) => {
    const isSelected = selectedStore?.id === item.id;
    const title = getStoreTitle(item);
    const subtitle = getStoreSubtitle(item);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, userInfo?.role !== 'ADMIN' && styles.enterCard]}
        onPress={() => handleSelectStore(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.brandName, isSelected && styles.textSelected]}>{title}</Text>
          <Text style={[styles.branchName, isSelected && styles.textSelected]}>{subtitle}</Text>
        </View>
        {userInfo?.role !== 'ADMIN' && (
          <View style={styles.enterBadge}>
            <Text style={styles.enterBadgeText}>입장</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleRequestStoreJoin = async (store: any) => {
    if (!userInfo?.id) {
      Alert.alert('오류', '로그인 정보가 없습니다.');
      return;
    }

    const submitRequest = async () => {
      setRequestingStoreId(store.id);
      try {
        await requestStoreJoinAPI(userInfo.id, store.id);
        Alert.alert('요청 완료', '관리자에게 근무 요청 알림을 보냈습니다.');
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
          '요청 실패',
          error.response?.data?.message || error.response?.data || '이미 신청했거나 요청을 처리하지 못했습니다.',
        );
      } finally {
        setRequestingStoreId(null);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`${getStoreTitle(store)}에 근무 요청을 보내시겠습니까?`);
      if (ok) {
        await submitRequest();
      }
      return;
    }

    Alert.alert(
      '근무 요청',
      `${getStoreTitle(store)}에 근무 요청을 보내시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '요청',
          onPress: submitRequest,
        },
      ],
    );
  };

  const renderRequestStoreItem = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.requestStoreName}>{getStoreTitle(item)}</Text>
        <Text style={styles.requestStoreAddress}>{getStoreSubtitle(item)}</Text>
      </View>
      {getApprovalStatus(item) === 'APPROVED' ? (
        <TouchableOpacity style={styles.requestButton} onPress={() => enterStore(item)}>
          <Text style={styles.requestButtonText}>입장</Text>
        </TouchableOpacity>
      ) : getApprovalStatus(item) === 'PENDING' ? (
        <View style={styles.pendingButton}>
          <Text style={styles.pendingButtonText}>승인 대기</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.requestButton, requestingStoreId === item.id && styles.requestButtonDisabled]}
          onPress={() => handleRequestStoreJoin(item)}
          disabled={requestingStoreId === item.id}
        >
          <Text style={styles.requestButtonText}>
            {requestingStoreId === item.id ? '요청 중' : '요청'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{userInfo?.role === 'ADMIN' ? '관리 지점 선택' : '근무 지점 확인'}</Text>
        <Text style={styles.subtitle}>
          {userInfo?.role === 'ADMIN'
            ? '운영할 매장을 선택해주세요.'
            : '승인된 지점은 입장하고, 미승인 지점은 요청 상태를 확인하세요.'}
        </Text>
      </View>
      <FlatList
        data={userInfo?.role !== 'ADMIN' ? filteredAllStores : stores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          userInfo?.role !== 'ADMIN' && !loading ? (
            <View style={styles.searchSection}>
              <Text style={styles.searchTitle}>매장 검색</Text>
              <Text style={styles.searchGuide}>근무할 매장을 검색해서 관리자에게 요청을 보내세요.</Text>
              <TextInput
                style={styles.searchInput}
                value={storeSearchTerm}
                onChangeText={setStoreSearchTerm}
                placeholder="매장명 또는 주소 검색"
                placeholderTextColor={colors.subText}
              />
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
              <Text style={styles.emptyTitle}>등록된 매장이 없습니다.</Text>
              <Text style={styles.emptyText}>먼저 웹 관리자 화면에서 매장을 등록해주세요.</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>검색된 매장이 없습니다.</Text>
              <Text style={styles.emptyText}>매장명 또는 주소를 다시 확인해주세요.</Text>
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
            <Text style={styles.confirmButtonText}>선택 완료</Text>
          </TouchableOpacity>
        )}
        {userInfo?.role === 'ADMIN' && stores.length === 0 && (
          <TouchableOpacity style={styles.confirmButton} onPress={() => navigation.navigate('AddBranch')}>
            <Text style={styles.confirmButtonText}>지점 등록</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setReloadKey(prev => prev + 1)}>
          <Text style={styles.secondaryButtonText}>새로고침</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryLight,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subText,
    marginTop: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  searchGuide: {
    color: colors.subText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  searchInput: {
    backgroundColor: colors.card,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enterCard: {
    borderColor: colors.primary,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  enterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  enterBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  branchName: {
    fontSize: 16,
    color: colors.subText,
    marginTop: 4,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestStoreName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  requestStoreAddress: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  requestButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 16,
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
    backgroundColor: colors.warningLight,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pendingButtonText: {
    color: '#92400E',
    fontSize: 14,
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
    color: colors.primaryDark,
  },
  bottomContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    backgroundColor: colors.card,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    backgroundColor: colors.card,
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 10,
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.dangerLight,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
});

export default BranchSelectScreen;
